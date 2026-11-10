import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AppSession } from "../../apps/web/src/lib/auth/session";
import { configureTestDatabase } from "./database-safety";
const databaseUrl = configureTestDatabase();
test("organization management workflows persist decisions, isolate customers and preserve financial ownership", { skip: !databaseUrl }, async t => {
  const { prisma } = await import("../../apps/web/src/lib/prisma");
  const service = await import("../../apps/web/src/features/org-management/service");
  const queries = await import("../../apps/web/src/features/org-management/queries");
  const tag = randomUUID();
  const users = await Promise.all(["Admin", "Reviewer", "Manager", "Office", "Tenant", "Other tenant"].map(name => prisma.user.create({ data: { fullName: `Management ${name}`, passwordHash: "test-only" } })));
  const [adminUser, reviewerUser, managerUser, officeUser, tenantUser, strangerUser] = users;
  const org = await prisma.organization.create({ data: { name: `Management ${tag}`, slug: `management-${tag}` } });
  const other = await prisma.organization.create({ data: { name: `Other ${tag}`, slug: `other-management-${tag}` } });
  function actor(index: number, role: AppSession["activeOrgRole"], orgId = org.id): AppSession { return { userId: users[index].id, fullName: users[index].fullName, email: null, platformRole: "USER", activeOrgId: orgId, activeOrgRole: role, membershipScope: { scopeType: "ORG", scopeId: orgId }, mustChangePassword: false, requiresTermsAcceptance: false }; }
  const admin = actor(0, "ADMIN"), reviewer = actor(1, "ADMIN"), manager = actor(2, "MANAGER"), office = actor(3, "OFFICE"), tenantActor = actor(4, "TENANT");
  try {
    await prisma.membership.createMany({ data: [{ orgId: org.id, userId: adminUser.id, role: "ADMIN" }, { orgId: org.id, userId: reviewerUser.id, role: "ADMIN" }, { orgId: org.id, userId: managerUser.id, role: "MANAGER" }, { orgId: org.id, userId: officeUser.id, role: "OFFICE" }] });
    const property = await prisma.property.create({ data: { orgId: org.id, name: "Management property" } });
    const unit = await prisma.unit.create({ data: { propertyId: property.id, houseNo: "A1", rentAmount: 1000, status: "OCCUPIED" } });
    const tenant = await prisma.tenant.create({ data: { orgId: org.id, userId: tenantUser.id, fullName: "Management tenant", phone: "0700000000" } });
    const lease = await prisma.lease.create({ data: { orgId: org.id, unitId: unit.id, tenantId: tenant.id, startDate: new Date("2025-01-01"), endDate: new Date(Date.now() - 86400000), monthlyRent: 1000 } });
    const charge = await prisma.rentCharge.create({ data: { orgId: org.id, leaseId: lease.id, period: "2026-10", amountDue: 1000, balance: 1000, dueDate: new Date("2026-10-05") } });
    await t.test("cross-organization foreign keys and service lookups reject unauthorized records", async () => {
      await assert.rejects(prisma.collectionPromise.create({ data: { orgId: other.id, leaseId: lease.id, assigneeId: managerUser.id, amount: 100, baselinePaid: 0, dueAt: new Date(), followUpAt: new Date(), notes: "Cross org" } }));
      await assert.rejects(service.requestApproval(actor(0, "ADMIN", other.id), { kind: "RENT_CHANGE", targetId: lease.id, amount: "1100", reason: "Cross organization change" }));
      await assert.rejects(service.createPromise({ ...office, membershipScope: { scopeType: "PROPERTY", scopeId: property.id } }, {}));
    });
    await t.test("rent change requires independent review and cannot replay", async () => {
      const request = await service.requestApproval(office, { kind: "RENT_CHANGE", targetId: lease.id, amount: "1100", reason: "Agreed monthly rent increase" });
      await assert.rejects(service.decideApproval(office, request.id, "APPROVED", "My request"));
      await service.decideApproval(admin, request.id, "APPROVED", "Reviewed agreement");
      assert.equal(String((await prisma.lease.findUniqueOrThrow({ where: { id: lease.id } })).monthlyRent), "1100");
      await assert.rejects(service.decideApproval(reviewer, request.id, "APPROVED", "Repeated request"));
    });
    await t.test("stale requests do not overwrite changed lease terms", async () => {
      const request = await service.requestApproval(office, { kind: "RENT_CHANGE", targetId: lease.id, amount: "1200", reason: "New proposed rent" });
      await prisma.lease.update({ where: { id: lease.id }, data: { monthlyRent: 1150 } });
      await assert.rejects(service.decideApproval(admin, request.id, "APPROVED", "Approve stale terms"));
      await service.decideApproval(office, request.id, "CANCELLED", "Replace changed terms");
    });
    await t.test("write-offs respect reviewer limits and reduce charges without inventing payments", async () => {
      await service.saveApprovalLimit(admin, "100");
      const request = await service.requestApproval(office, { kind: "WRITE_OFF", targetId: charge.id, amount: "200", reason: "Approved tenant debt concession" });
      await assert.rejects(service.decideApproval(manager, request.id, "APPROVED", "Over limit"));
      await service.decideApproval(admin, request.id, "APPROVED", "Debt concession approved");
      const updated = await prisma.rentCharge.findUniqueOrThrow({ where: { id: charge.id } });
      assert.equal(Number(updated.balance), 800); assert.equal(Number(updated.amountPaid), 0); assert.equal(Number(updated.amountDue), 800);
      assert.equal(await prisma.payment.count({ where: { orgId: org.id } }), 0);
    });
    await t.test("expenditure authors cannot approve their own costs through another request", async () => {
      const expense = await prisma.expenditure.create({ data: { orgId: org.id, scope: "ORGANIZATION", category: "MAINTENANCE", description: "Repair expense", amount: 80, currencyCode: "KES", incurredAt: new Date(), status: "PENDING_APPROVAL", createdByUserId: adminUser.id } });
      const request = await service.requestApproval(reviewer, { kind: "EXPENSE", targetId: expense.id, amount: "", reason: "Repair completed and invoice received" });
      await assert.rejects(service.decideApproval(admin, request.id, "APPROVED", "Own expense"));
      await service.decideApproval(manager, request.id, "APPROVED", "Within limit");
      assert.equal((await prisma.expenditure.findUniqueOrThrow({ where: { id: expense.id } })).status, "APPROVED");
    });
    await t.test("accrued write-offs post balanced journals and a closed period rolls back the whole decision", async () => {
      const { ensureAccountingFoundation, postJournalEntry } = await import("../../apps/web/src/lib/accounting/engine");
      await ensureAccountingFoundation(prisma, org.id);
      const accrued = await prisma.rentCharge.create({ data: { orgId: org.id, leaseId: lease.id, period: "2026-09", amountDue: 500, balance: 500, dueDate: new Date("2026-09-05") } });
      const entry = await postJournalEntry({ db: prisma, orgId: org.id, entryDate: new Date(), description: "Test receivable", sourceType: "RENT_CHARGE_ACCRUAL", sourceId: accrued.id, lines: [{ systemKey: "TENANT_RECEIVABLES", debit: 500 }, { systemKey: "RENT_INCOME", credit: 500 }] });
      await prisma.rentCharge.update({ where: { id: accrued.id }, data: { journalEntryId: entry.id } });
      const request = await service.requestApproval(office, { kind: "WRITE_OFF", targetId: accrued.id, amount: "100", reason: "Accrued debt concession" });
      await service.decideApproval(admin, request.id, "APPROVED", "Concession authorized");
      const adjustment = await prisma.accountingJournalEntry.findFirstOrThrow({ where: { orgId: org.id, sourceId: `write-off:${request.id}` }, include: { lines: true } });
      assert.equal(adjustment.lines.reduce((sum, line) => sum + Number(line.debit), 0), 100);
      assert.equal(adjustment.lines.reduce((sum, line) => sum + Number(line.credit), 0), 100);
      const next = await service.requestApproval(office, { kind: "WRITE_OFF", targetId: accrued.id, amount: "100", reason: "Second accrued debt concession" });
      const period = await prisma.accountingPeriod.findFirstOrThrow({ where: { orgId: org.id, startsAt: { lte: new Date() }, endsAt: { gte: new Date() } } });
      await prisma.accountingPeriod.update({ where: { id: period.id }, data: { status: "CLOSED" } });
      await assert.rejects(service.decideApproval(admin, next.id, "APPROVED", "Must fail in closed period"));
      assert.equal(Number((await prisma.rentCharge.findUniqueOrThrow({ where: { id: accrued.id } })).balance), 400);
      assert.equal((await prisma.orgManagementApproval.findUniqueOrThrow({ where: { id: next.id } })).status, "PENDING");
      await prisma.accountingPeriod.update({ where: { id: period.id }, data: { status: "OPEN" } });
      await service.decideApproval(office, next.id, "CANCELLED", "Do not proceed");
      await prisma.rentCharge.delete({ where: { id: accrued.id } });
    });
    await t.test("refund approval authorizes the current settlement without claiming money was sent", async () => {
      const notice = await prisma.moveOutNotice.create({ data: { referenceCode: `management-refund-${tag}`, leaseId: lease.id, tenantId: tenant.id, moveOutDate: new Date(), status: "CLOSED", closeout: { refundStatus: "PENDING", refundDue: 250 } } });
      const request = await service.requestApproval(office, { kind: "REFUND", targetId: notice.id, amount: "", reason: "Authorize the agreed deposit settlement" });
      await service.decideApproval(admin, request.id, "APPROVED", "Refund authorized pending actual payment proof");
      const result = await prisma.moveOutNotice.findUniqueOrThrow({ where: { id: notice.id } });
      assert.equal((result.closeout as { refundStatus: string }).refundStatus, "PENDING");
      assert.equal(await prisma.payment.count({ where: { orgId: org.id } }), 0);
      await prisma.moveOutNotice.delete({ where: { id: notice.id } });
    });
    await t.test("promise fulfilment requires allocated payment progress and permits new follow-up after resolution", async () => {
      const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      await service.createPromise(office, { leaseId: lease.id, assigneeId: managerUser.id, amount: "100", dueDate: date, followUpDate: date, notes: "Tenant promises to pay tomorrow" });
      const promise = await prisma.collectionPromise.findFirstOrThrow({ where: { orgId: org.id } });
      await assert.rejects(service.resolvePromise(manager, promise.id, "FULFILLED", "No payment yet"));
      await assert.rejects(service.resolvePromise(manager, promise.id, "BROKEN", "Not due yet"));
      await prisma.rentCharge.update({ where: { id: charge.id }, data: { amountPaid: 100, balance: 700, status: "PARTIAL" } });
      assert.equal((await queries.collectionData(manager, 1)).promises[0].progress.status, "FULFILLED");
      await service.resolvePromise(manager, promise.id, "FULFILLED", "Verified allocation received");
      await assert.rejects(service.resolvePromise(manager, promise.id, "CANCELLED", "Already finished"));
    });
    await t.test("renewal responses belong to the tenant; accepted terms update the lease and preserve old bills", async () => {
      const future = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
      await service.offerRenewal(office, { leaseId: lease.id, proposedRent: "1300", proposedEndDate: future, notice: "Please review the offered renewal terms." });
      const offer = await prisma.leaseRenewal.findFirstOrThrow({ where: { orgId: org.id } });
      await assert.rejects(service.respondRenewal({ ...tenantActor, userId: strangerUser.id }, offer.id, "ACCEPTED", "Not my lease"));
      await assert.rejects(service.finishRenewal(admin, offer.id, "APPLY"));
      await service.respondRenewal(tenantActor, offer.id, "ACCEPTED", "I accept these terms");
      await service.finishRenewal(admin, offer.id, "APPLY");
      const updated = await prisma.lease.findUniqueOrThrow({ where: { id: lease.id } });
      assert.equal(Number(updated.monthlyRent), 1300); assert.equal(Number((await prisma.rentCharge.findUniqueOrThrow({ where: { id: charge.id } })).amountDue), 800);
    });
    await t.test("temporary coverage transfers work and returns only unfinished assignments still owned by the cover", async () => {
      const task = await prisma.crmActivity.create({ data: { scopeOrgId: org.id, tenantId: tenant.id, authorId: adminUser.id, assigneeId: officeUser.id, kind: "TASK", body: "Call tenant", dueAt: new Date() } });
      const completedTask = await prisma.crmActivity.create({ data: { scopeOrgId: org.id, tenantId: tenant.id, authorId: adminUser.id, assigneeId: officeUser.id, kind: "TASK", body: "Finished during coverage", dueAt: new Date() } });
      const issue = await prisma.issueTicket.create({ data: { orgId: org.id, unitId: unit.id, reportedByUserId: tenantUser.id, assignedToUserId: officeUser.id, title: "Test repair", description: "Repair required" } });
      await service.createHandover(admin, { fromUserId: officeUser.id, toUserId: managerUser.id, endDate: "", notes: "Cover the open tenant follow-ups" });
      const handover = await prisma.staffHandover.findFirstOrThrow({ where: { orgId: org.id } });
      assert.equal((await prisma.crmActivity.findUniqueOrThrow({ where: { id: task.id } })).assigneeId, managerUser.id);
      await prisma.crmActivity.update({ where: { id: completedTask.id }, data: { completedAt: new Date() } });
      await prisma.issueTicket.update({ where: { id: issue.id }, data: { assignedToUserId: reviewerUser.id } });
      await service.finishHandover(admin, handover.id, true);
      assert.equal((await prisma.crmActivity.findUniqueOrThrow({ where: { id: task.id } })).assigneeId, officeUser.id);
      assert.equal((await prisma.crmActivity.findUniqueOrThrow({ where: { id: completedTask.id } })).assigneeId, managerUser.id);
      assert.equal((await prisma.issueTicket.findUniqueOrThrow({ where: { id: issue.id } })).assignedToUserId, reviewerUser.id);
    });
    await t.test("audit and property reports remain organization-scoped and avoid multiplying charge totals", async () => {
      await prisma.unit.createMany({ data: [{ propertyId: property.id, houseNo: "A2", rentAmount: 1000, status: "VACANT" }, { propertyId: property.id, houseNo: "A3", rentAmount: 1000, status: "UNDER_MAINTENANCE" }] });
      await prisma.expenditure.create({ data: { orgId: org.id, propertyId: property.id, scope: "ORGANIZATION", category: "MAINTENANCE", description: "Paid maintenance in reporting month", amount: 50, currencyCode: "KES", incurredAt: new Date("2026-10-15"), status: "PAID", createdByUserId: adminUser.id } });
      await prisma.auditLog.create({ data: { orgId: other.id, actorUserId: adminUser.id, action: "OTHER_ORG_PRIVATE_EVENT", entityType: "Organization", entityId: other.id } });
      const logs = await queries.activityData(admin, 1, "OTHER_ORG_PRIVATE_EVENT", "", "", ""); assert.equal(logs.total, 0);
      const report = await queries.propertyPerformance(admin, "2026-10", 1);
      assert.equal(report.rows.length, 1); assert.equal(report.rows[0].charged, 800); assert.equal(report.rows[0].collected, 100); assert.equal(report.rows[0].arrears, 700);
      assert.ok(Math.abs(report.rows[0].occupancyRate! - 100 / 3) < 0.0001);
      assert.equal(Number(report.rows[0].maintenanceCosts), 50); assert.equal(report.rows[0].netIncome, 50);
    });
    await t.test("staff suspension revokes only the selected membership and cannot target administrators", async () => {
      const member = await prisma.membership.findFirstOrThrow({ where: { orgId: org.id, userId: officeUser.id } });
      await prisma.userSession.create({ data: { userId: officeUser.id, activeMembershipId: member.id, tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 86400000) } });
      const request = await service.requestApproval(admin, { kind: "STAFF_ACCESS", targetId: member.id, amount: "", reason: "Staff departure access review" });
      await assert.rejects(service.decideApproval(admin, request.id, "APPROVED", "Self approval"));
      await service.decideApproval(reviewer, request.id, "APPROVED", "Departure confirmed");
      assert.ok((await prisma.membership.findUniqueOrThrow({ where: { id: member.id } })).deactivatedAt);
      assert.equal(await prisma.userSession.count({ where: { activeMembershipId: member.id } }), 0);
      assert.equal((await prisma.user.findUniqueOrThrow({ where: { id: officeUser.id } })).status, "ACTIVE");
    });
  } finally {
    try {
      const { purgeOrganization } = await import("../../apps/web/src/lib/data-retention/organization-deletion");
      const old = new Date(Date.now() - 31 * 86400000);
      for (const organization of [org, other]) {
        await prisma.organization.update({ where: { id: organization.id }, data: { status: "DISABLED", deletedAt: old } });
        await prisma.auditLog.create({ data: { orgId: organization.id, actorUserId: adminUser.id, action: "ORGANIZATION_DELETE_REQUESTED", entityType: "Organization", entityId: organization.id, createdAt: old } });
        await purgeOrganization(prisma, organization.id);
      }
      await prisma.user.deleteMany({ where: { id: { in: users.map(v => v.id) } } });
    } finally { await prisma.$disconnect(); }
  }
});
