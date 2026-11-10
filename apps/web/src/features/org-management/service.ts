import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/auth/session";
import { postJournalEntry } from "@/lib/accounting/engine";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { readOrgRolePolicies } from "@/lib/permissions/org-role-policy";
import { applyFeatureAccess } from "@/lib/org/features";
import { applyOrganizationPlanAccess } from "@/lib/billing/organization-plan-policy";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";
import { nairobiDayStart } from "@/lib/billing/period-dates";
import { approvalSchema, assertManagementSession, canAccessApprovalKind, canReview, endOfDay, ensure, handoverSchema, promiseSchema, renewalSchema } from "./policy";

type Tx = Prisma.TransactionClient;
const activeStaff = (orgId: string) => ({ orgId, scopeType: "ORG" as const, deactivatedAt: null, employmentEndedAt: null, role: { in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"] as ("ADMIN" | "MANAGER" | "OFFICE" | "ACCOUNTANT")[] }, user: { status: "ACTIVE" as const, deletedAt: null } });
export { activeStaff };
const leaseWhere = (orgId: string) => ({ orgId, deletedAt: null, status: "ACTIVE" as const, tenant: { deletedAt: null }, unit: { deletedAt: null, property: { orgId, deletedAt: null } } });
export { leaseWhere };
export async function assertAssigneeAccess(tx: Tx, session: AppSession, userId: string, paths: string[]) {
  const orgId = session.activeOrgId!;
  const member = await tx.membership.findFirst({ where: { ...activeStaff(orgId), userId } });
  ensure(member, "The assignee must have active organization-wide access.");
  const [settings, subscription] = await Promise.all([
    tx.organizationSettings.findUnique({ where: { orgId }, select: { roleAccess: true } }),
    tx.subscription.findUnique({ where: { orgId }, select: { plan: true, metadata: true } }),
  ]);
  const target = { ...session, userId, activeOrgRole: member.role, grantedPermissions: member.grantedPermissions,
    orgRolePolicy: applyFeatureAccess(applyOrganizationPlanAccess(readOrgRolePolicies(settings?.roleAccess)[member.role], subscription?.plan ?? "FREE", subscription?.metadata), session.orgFeatures ?? {}) };
  ensure(paths.every(path => canAccessWorkspacePath(target, path)), "The assignee does not have access to all of these workspaces. Adjust their access separately before transferring work.");
  ensure((!paths.includes("/dashboard/org/collections") || memberHasOrgPermission(target, "payments.record")) && (!paths.includes("/dashboard/org/issues") || memberHasOrgPermission(target, "maintenance.manage")), "The assignee's permissions do not cover these assignments.");
  return member;
}
async function audit(tx: Tx, session: AppSession, action: string, entityId: string, metadata: Prisma.InputJsonObject = {}) {
  await tx.auditLog.create({ data: { orgId: session.activeOrgId!, actorUserId: session.userId, action, entityType: "OrgManagement", entityId, metadata } });
}
async function notify(tx: Tx, orgId: string, userId: string, title: string, message: string, tenantId?: string) {
  await tx.notification.create({ data: { orgId, userId, tenantId, channel: "IN_APP", type: "GENERAL", title, message, status: "SENT", sentAt: new Date() } });
}

async function approvalTarget(tx: Tx, orgId: string, kind: string, targetId: string) {
  if (kind === "RENT_CHANGE") {
    const lease = await tx.lease.findFirst({ where: { ...leaseWhere(orgId), id: targetId } });
    ensure(lease, "Active lease unavailable.");
    return { version: lease.updatedAt.toISOString(), label: "Lease rent", value: lease.monthlyRent.toString() };
  }
  if (kind === "WRITE_OFF") {
    const charge = await tx.rentCharge.findFirst({ where: { orgId, id: targetId, balance: { gt: 0 }, lease: { deletedAt: null } } });
    ensure(charge, "Outstanding charge unavailable.");
    return { version: charge.updatedAt.toISOString(), label: `${charge.chargeType} ${charge.period}`, value: charge.balance.toString() };
  }
  if (kind === "EXPENSE") {
    const expense = await tx.expenditure.findFirst({ where: { orgId, scope: "ORGANIZATION", id: targetId, status: "PENDING_APPROVAL" } });
    ensure(expense, "Pending organization expenditure unavailable.");
    return { version: expense.updatedAt.toISOString(), label: expense.description, value: expense.amount.toString(), ownerId: expense.createdByUserId };
  }
  if (kind === "REFUND") {
    const notice = await tx.moveOutNotice.findFirst({ where: { id: targetId, lease: { orgId, deletedAt: null } }, select: { id: true, closeout: true } });
    const closeout = notice?.closeout as Record<string, unknown> | null;
    ensure(notice && closeout?.refundStatus === "PENDING" && typeof closeout.refundDue === "number" && closeout.refundDue > 0, "A pending deposit refund is required.");
    return { version: JSON.stringify(closeout), label: "Deposit refund", value: String(closeout.refundDue) };
  }
  const member = await tx.membership.findFirst({ where: { orgId, id: targetId, role: { in: ["MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "SECURITY"] }, employmentEndedAt: null, deactivatedAt: null }, include: { user: { select: { fullName: true } } } });
  ensure(member, "Active non-administrator staff membership unavailable.");
  return { version: member.updatedAt.toISOString(), label: `Suspend ${member.user.fullName} (${member.role})`, value: "0", userId: member.userId };
}
export async function requestApproval(session: AppSession, input: unknown) {
  const orgId = assertManagementSession(session, "approvals");
  const data = approvalSchema.parse(input);
  ensure(canAccessApprovalKind(session, data.kind), "Access to the source workspace is required.");
  return prisma.$transaction(async tx => {
    const snapshot = await approvalTarget(tx, orgId, data.kind, data.targetId);
    ensure(!("userId" in snapshot) || snapshot.userId !== session.userId, "You cannot request your own suspension.");
    const amount = new Prisma.Decimal(["RENT_CHANGE", "WRITE_OFF"].includes(data.kind) ? data.amount || "0" : snapshot.value);
    ensure(data.kind === "STAFF_ACCESS" || amount.gt(0), "Enter an amount greater than zero.");
    if (data.kind === "WRITE_OFF") ensure(amount.lte(snapshot.value), "Write-off exceeds the outstanding balance.");
    ensure(!await tx.orgManagementApproval.findFirst({ where: { orgId, targetId: data.targetId, kind: data.kind, status: "PENDING" } }), "This record already has a pending request.");
    const request = await tx.orgManagementApproval.create({ data: { orgId, kind: data.kind, targetId: data.targetId, amount, reason: data.reason, requestedByUserId: session.userId, snapshot } });
    await audit(tx, session, "MANAGEMENT_APPROVAL_REQUESTED", request.id, { kind: data.kind, targetId: data.targetId, amount: amount.toString() });
    const reviewers = await tx.membership.findMany({ where: { ...activeStaff(orgId), role: "ADMIN", userId: { not: session.userId } }, select: { userId: true }, distinct: ["userId"] });
    for (const reviewer of reviewers) await notify(tx, orgId, reviewer.userId, "Approval requested", `${snapshot.label}: ${data.reason}`);
    return request;
  }, { isolationLevel: "Serializable" });
}
export async function decideApproval(session: AppSession, id: string, decision: string, note: string) {
  const orgId = assertManagementSession(session, "approvals");
  ensure(["APPROVED", "REJECTED", "CANCELLED"].includes(decision) && note.trim().length >= 3 && note.length <= 2000, "Choose a decision and add a review note.");
  return prisma.$transaction(async tx => {
    const request = await tx.orgManagementApproval.findFirst({ where: { id, orgId, status: "PENDING" } });
    ensure(request, "Request already reviewed or unavailable.");
    ensure(canAccessApprovalKind(session, request.kind), "Access to the source workspace is required.");
    const limit = await tx.orgManagementPolicy.findUnique({ where: { orgId } });
    if (decision === "CANCELLED") ensure(request.requestedByUserId === session.userId, "Only the requester can withdraw this request.");
    else {
      ensure(request.requestedByUserId !== session.userId, "A different person must review this request.");
      ensure(canReview(session, request.kind, Number(request.amount), Number(limit?.managerApprovalLimit ?? 0)), "This decision requires an authorized reviewer within their approval limit.");
    }
    if (decision === "APPROVED") {
      const current = await approvalTarget(tx, orgId, request.kind, request.targetId);
      ensure(!("ownerId" in current) || current.ownerId !== session.userId, "The expense creator cannot approve their own expenditure.");
      const snapshot = request.snapshot as { version: string };
      ensure(current.version === snapshot.version, "The source record changed. Withdraw this request and submit a fresh one.");
      if (request.kind === "RENT_CHANGE") await tx.lease.update({ where: { id: request.targetId }, data: { monthlyRent: request.amount! } });
      if (request.kind === "EXPENSE") await tx.expenditure.update({ where: { id: request.targetId }, data: { status: "APPROVED", approvedByUserId: session.userId, approvedAt: new Date() } });
      if (request.kind === "STAFF_ACCESS") {
        ensure("userId" in current && current.userId !== session.userId, "You cannot suspend your own access.");
        await tx.membership.update({ where: { id: request.targetId }, data: { deactivatedAt: new Date(), deactivatedByUserId: session.userId, deactivationNotes: note } });
        await tx.userSession.deleteMany({ where: { activeMembershipId: request.targetId } });
      }
      if (request.kind === "WRITE_OFF") {
        const charge = await tx.rentCharge.findFirstOrThrow({ where: { orgId, id: request.targetId }, include: { lease: { select: { tenantId: true, unitId: true, unit: { select: { propertyId: true } } } } } });
        const amount = request.amount!;
        const balance = charge.balance.minus(amount);
        ensure(balance.gte(0), "The charge balance changed.");
        if (charge.journalEntryId) await postJournalEntry({ db: tx, orgId, entryDate: new Date(), sourceType: "ADJUSTMENT", sourceId: `write-off:${id}`, userId: session.userId, description: `Approved write-off: ${request.reason}`, lines: [
          { systemKey: "OTHER_EXPENSE", debit: amount, propertyId: charge.lease.unit.propertyId, unitId: charge.lease.unitId, tenantId: charge.lease.tenantId },
          { systemKey: "TENANT_RECEIVABLES", credit: amount, propertyId: charge.lease.unit.propertyId, unitId: charge.lease.unitId, tenantId: charge.lease.tenantId },
        ] });
        await tx.rentCharge.update({ where: { id: charge.id }, data: { amountDue: charge.amountDue.minus(amount), balance, status: balance.isZero() ? "WAIVED" : charge.amountPaid.gt(0) ? "PARTIAL" : "UNPAID" } });
      }
    }
    await tx.orgManagementApproval.update({ where: { id }, data: { status: decision, reviewedByUserId: session.userId, reviewedAt: new Date(), reviewNote: note.trim() } });
    await audit(tx, session, `MANAGEMENT_APPROVAL_${decision}`, id, { kind: request.kind, targetId: request.targetId, amount: request.amount?.toString() ?? "0", note });
    await notify(tx, orgId, request.requestedByUserId, `Request ${decision.toLowerCase()}`, note);
  }, { isolationLevel: "Serializable" });
}
export async function saveApprovalLimit(session: AppSession, amount: string) {
  const orgId = assertManagementSession(session, "approvals");
  ensure(session.activeOrgRole === "ADMIN" && /^\d{1,10}(\.\d{1,2})?$/.test(amount), "An administrator must enter a valid approval limit.");
  await prisma.$transaction(async tx => {
    await tx.orgManagementPolicy.upsert({ where: { orgId }, create: { orgId, managerApprovalLimit: amount }, update: { managerApprovalLimit: amount } });
    await audit(tx, session, "MANAGEMENT_APPROVAL_LIMIT_CHANGED", orgId, { amount });
  });
}
export async function createPromise(session: AppSession, input: unknown) {
  const orgId = assertManagementSession(session, "collections");
  const data = promiseSchema.parse(input);
  const dueAt = endOfDay(data.dueDate), followUpAt = endOfDay(data.followUpDate);
  ensure(dueAt > new Date() && followUpAt >= dueAt, "Promise must be due today or later, with follow-up on or after its due date.");
  await prisma.$transaction(async tx => {
    const lease = await tx.lease.findFirst({ where: { ...leaseWhere(orgId), id: data.leaseId } });
    ensure(lease, "Active lease unavailable.");
    await assertAssigneeAccess(tx, session, data.assigneeId, ["/dashboard/org/collections"]);
    const totals = await tx.rentCharge.aggregate({ where: { orgId, leaseId: lease.id }, _sum: { amountPaid: true, balance: true } });
    const overdue = await tx.rentCharge.count({ where: { orgId, leaseId: lease.id, dueDate: { lt: nairobiDayStart() }, balance: { gt: 0 } } });
    ensure(overdue && Number(data.amount) <= Number(totals._sum.balance), "Choose an overdue lease and an amount within its outstanding balance.");
    ensure(!await tx.collectionPromise.findFirst({ where: { orgId, leaseId: lease.id, status: "OPEN" } }), "Resolve the existing promise before creating another.");
    const promise = await tx.collectionPromise.create({ data: { orgId, leaseId: lease.id, assigneeId: data.assigneeId, amount: data.amount, baselinePaid: totals._sum.amountPaid ?? 0, dueAt, followUpAt, notes: data.notes } });
    await audit(tx, session, "COLLECTION_PROMISE_CREATED", promise.id, { leaseId: lease.id, assigneeId: data.assigneeId, amount: data.amount });
    await notify(tx, orgId, data.assigneeId, "Arrears follow-up assigned", data.notes);
  }, { isolationLevel: "Serializable" });
}
export async function resolvePromise(session: AppSession, id: string, status: string, note: string) {
  const orgId = assertManagementSession(session, "collections");
  ensure(["FULFILLED", "BROKEN", "CANCELLED"].includes(status) && note.trim().length >= 3 && note.length <= 2000, "Record an outcome and note.");
  await prisma.$transaction(async tx => {
    const promise = await tx.collectionPromise.findFirst({ where: { orgId, id, status: "OPEN" } });
    ensure(promise, "Open promise unavailable.");
    if (status === "FULFILLED") {
      const total = await tx.rentCharge.aggregate({ where: { orgId, leaseId: promise.leaseId }, _sum: { amountPaid: true } });
      ensure(new Prisma.Decimal(total._sum.amountPaid ?? 0).minus(promise.baselinePaid).gte(promise.amount), "Verified payments have not yet met this promise.");
    }
    if (status === "BROKEN") ensure(promise.dueAt < new Date(), "A promise cannot be marked broken before its due date.");
    await tx.collectionPromise.update({ where: { id }, data: { status, outcomeNote: note, resolvedAt: new Date() } });
    await audit(tx, session, `COLLECTION_PROMISE_${status}`, id, { note });
  }, { isolationLevel: "Serializable" });
}
export async function offerRenewal(session: AppSession, input: unknown) {
  const orgId = assertManagementSession(session, "renewals");
  const data = renewalSchema.parse(input);
  await prisma.$transaction(async tx => {
    const lease = await tx.lease.findFirst({ where: { ...leaseWhere(orgId), id: data.leaseId }, include: { tenant: { select: { userId: true } } } });
    ensure(lease?.endDate && lease.tenant.userId, "A fixed-term active lease with a tenant portal account is required.");
    const endDate = endOfDay(data.proposedEndDate);
    ensure(endDate > lease.endDate && endDate > new Date(), "The new end date must extend the current lease into the future.");
    ensure(!await tx.leaseRenewal.findFirst({ where: { orgId, leaseId: lease.id, status: { in: ["OFFERED", "ACCEPTED"] } } }), "A renewal is already open for this lease.");
    const offer = await tx.leaseRenewal.create({ data: { orgId, leaseId: lease.id, proposedRent: data.proposedRent, proposedEndDate: endDate, originalRent: lease.monthlyRent, originalEndDate: lease.endDate, notice: data.notice, createdByUserId: session.userId } });
    await notify(tx, orgId, lease.tenant.userId, "Lease renewal offer", `${data.notice}\nProposed monthly rent: ${data.proposedRent}. Proposed end date: ${data.proposedEndDate}. Review in Lease renewals.`, lease.tenantId);
    await audit(tx, session, "LEASE_RENEWAL_OFFERED", offer.id, { leaseId: lease.id, proposedRent: data.proposedRent, proposedEndDate: data.proposedEndDate });
  }, { isolationLevel: "Serializable" });
}
export async function respondRenewal(session: AppSession, id: string, response: string, note: string) {
  ensure(session.activeOrgId && session.activeOrgRole === "TENANT" && !session.mustChangePassword && !session.requiresTermsAcceptance, "Tenant access is required.");
  ensure(["ACCEPTED", "DECLINED"].includes(response) && note.length <= 2000, "Choose a valid renewal response.");
  await prisma.$transaction(async tx => {
    const offer = await tx.leaseRenewal.findFirst({ where: { id, orgId: session.activeOrgId!, status: "OFFERED" } });
    ensure(offer, "Renewal offer unavailable.");
    ensure(await tx.lease.findFirst({ where: { ...leaseWhere(session.activeOrgId!), id: offer.leaseId, tenant: { userId: session.userId, deletedAt: null } } }), "This offer is unavailable for your account.");
    ensure(offer.proposedEndDate > new Date(), "This offer has expired. Contact your manager.");
    await tx.leaseRenewal.update({ where: { id }, data: { status: response, responseNote: note, respondedAt: new Date() } });
    await audit(tx, session, `LEASE_RENEWAL_${response}`, id, { note });
    await notify(tx, offer.orgId, offer.createdByUserId, `Renewal ${response.toLowerCase()}`, `Your tenant has ${response.toLowerCase()} the renewal offer.`);
  }, { isolationLevel: "Serializable" });
}
export async function finishRenewal(session: AppSession, id: string, action: string) {
  const orgId = assertManagementSession(session, "renewals");
  ensure(["APPLY", "WITHDRAW"].includes(action), "Choose a valid renewal action.");
  ensure(session.activeOrgRole === "ADMIN" || action === "WITHDRAW", "An administrator must finalize the agreed lease terms.");
  await prisma.$transaction(async tx => {
    const offer = await tx.leaseRenewal.findFirst({ where: { orgId, id, status: { in: ["OFFERED", "ACCEPTED"] } } });
    ensure(offer, "Open renewal unavailable.");
    if (action === "APPLY") {
      ensure(offer.status === "ACCEPTED", "The tenant must accept the offer first.");
      const lease = await tx.lease.findFirst({ where: { ...leaseWhere(orgId), id: offer.leaseId } });
      ensure(lease?.endDate && lease.endDate.getTime() === offer.originalEndDate.getTime() && lease.monthlyRent.eq(offer.originalRent), "Lease terms changed. Withdraw this offer and create a new one.");
      ensure(offer.proposedEndDate > new Date(), "The proposed lease term has expired.");
      ensure(offer.proposedRent.eq(lease.monthlyRent) || lease.endDate <= new Date(), "The new rent can be applied when the current term ends. The accepted offer remains available until then.");
      await tx.lease.update({ where: { id: lease.id }, data: { endDate: offer.proposedEndDate, monthlyRent: offer.proposedRent } });
    }
    await tx.leaseRenewal.update({ where: { id }, data: { status: action === "APPLY" ? "APPLIED" : "WITHDRAWN", appliedAt: action === "APPLY" ? new Date() : null } });
    await audit(tx, session, `LEASE_RENEWAL_${action === "APPLY" ? "APPLIED" : "WITHDRAWN"}`, id, { leaseId: offer.leaseId });
  }, { isolationLevel: "Serializable" });
}

export async function createHandover(session: AppSession, input: unknown) {
  const orgId = assertManagementSession(session, "handovers");
  const data = handoverSchema.parse(input);
  ensure(data.fromUserId !== data.toUserId, "Choose different outgoing and covering staff.");
  const endsAt = data.endDate ? endOfDay(data.endDate) : null;
  ensure(!endsAt || endsAt > new Date(), "Coverage must end today or later.");
  await prisma.$transaction(async tx => {
    const from = await tx.membership.findFirst({ where: { orgId, userId: data.fromUserId, scopeType: "ORG", role: { in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"] } } });
    const to = await tx.membership.findFirst({ where: { ...activeStaff(orgId), userId: data.toUserId } });
    ensure(from && to, "Choose organization-wide staff; the covering account must be active.");
    // The recipient's current permissions are used; no role or access grants are copied.
    ensure(to.role === "ADMIN" || to.role === "MANAGER" || to.role === from.role, "Choose a manager or a colleague with the same role to cover this work.");
    ensure(!await tx.staffHandover.findFirst({ where: { orgId, status: "ACTIVE", OR: [{ fromUserId: { in: [data.fromUserId, data.toUserId] } }, { toUserId: { in: [data.fromUserId, data.toUserId] } }] } }), "Finish overlapping staff coverage before starting a new handover.");
    const tasks = await tx.crmActivity.findMany({ where: { scopeOrgId: orgId, assigneeId: data.fromUserId, completedAt: null, kind: { in: ["TASK", "DEMO"] } }, select: { id: true } });
    const promises = await tx.collectionPromise.findMany({ where: { orgId, assigneeId: data.fromUserId, status: "OPEN" }, select: { id: true } });
    const issues = await tx.issueTicket.findMany({ where: { orgId, assignedToUserId: data.fromUserId, status: { in: ["OPEN", "IN_PROGRESS"] } }, select: { id: true } });
    await assertAssigneeAccess(tx, session, data.toUserId, [...(tasks.length ? ["/dashboard/org/crm"] : []), ...(promises.length ? ["/dashboard/org/collections"] : []), ...(issues.length ? ["/dashboard/org/issues"] : [])]);
    ensure(tasks.length + promises.length + issues.length > 0, "This staff member has no outstanding assignments to hand over.");
    const ids = { tasks: tasks.map(v => v.id), promises: promises.map(v => v.id), issues: issues.map(v => v.id) };
    await tx.crmActivity.updateMany({ where: { scopeOrgId: orgId, id: { in: ids.tasks }, assigneeId: data.fromUserId }, data: { assigneeId: data.toUserId } });
    await tx.collectionPromise.updateMany({ where: { orgId, id: { in: ids.promises }, assigneeId: data.fromUserId }, data: { assigneeId: data.toUserId } });
    await tx.issueTicket.updateMany({ where: { orgId, id: { in: ids.issues }, assignedToUserId: data.fromUserId }, data: { assignedToUserId: data.toUserId, assignedByUserId: session.userId } });
    const handover = await tx.staffHandover.create({ data: { orgId, fromUserId: data.fromUserId, toUserId: data.toUserId, createdByUserId: session.userId, startsAt: new Date(), endsAt, notes: data.notes, assignments: ids } });
    await audit(tx, session, "STAFF_HANDOVER_CREATED", handover.id, { fromUserId: data.fromUserId, toUserId: data.toUserId, ...ids });
    await notify(tx, orgId, data.toUserId, "Staff coverage assigned", `${tasks.length} follow-ups, ${promises.length} payment promises and ${issues.length} maintenance requests. ${data.notes}`);
  }, { isolationLevel: "Serializable" });
}
export async function finishHandover(session: AppSession, id: string, returnWork: boolean) {
  const orgId = assertManagementSession(session, "handovers");
  await prisma.$transaction(async tx => {
    const handover = await tx.staffHandover.findFirst({ where: { orgId, id, status: "ACTIVE" } });
    ensure(handover, "Active handover unavailable.");
    if (returnWork) {
      ensure(await tx.membership.findFirst({ where: { ...activeStaff(orgId), userId: handover.fromUserId } }), "The original owner must have active access before returning work.");
      const ids = handover.assignments as { tasks: string[]; promises: string[]; issues: string[] };
      await assertAssigneeAccess(tx, session, handover.fromUserId, [...(ids.tasks.length ? ["/dashboard/org/crm"] : []), ...(ids.promises.length ? ["/dashboard/org/collections"] : []), ...(ids.issues.length ? ["/dashboard/org/issues"] : [])]);
      await tx.crmActivity.updateMany({ where: { scopeOrgId: orgId, id: { in: ids.tasks }, assigneeId: handover.toUserId, completedAt: null }, data: { assigneeId: handover.fromUserId } });
      await tx.collectionPromise.updateMany({ where: { orgId, id: { in: ids.promises }, assigneeId: handover.toUserId, status: "OPEN" }, data: { assigneeId: handover.fromUserId } });
      await tx.issueTicket.updateMany({ where: { orgId, id: { in: ids.issues }, assignedToUserId: handover.toUserId, status: { in: ["OPEN", "IN_PROGRESS"] } }, data: { assignedToUserId: handover.fromUserId, assignedByUserId: session.userId } });
    }
    await tx.staffHandover.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date() } });
    await audit(tx, session, "STAFF_HANDOVER_COMPLETED", id, { returnWork });
  }, { isolationLevel: "Serializable" });
}
