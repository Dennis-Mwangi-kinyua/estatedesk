"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess, requireOrgPermission } from "@/lib/permissions/guards";
import { approvalSettlement, latestArrearsApproval } from "@/lib/move-outs/arrears-approval";
import { notifyInAppAndPush } from "@/lib/notifications/notify";
import { encodePublicId } from "@/lib/public-id";

function refresh(noticeId: string) {
  revalidatePath("/dashboard/org/move-outs");
  revalidatePath(`/dashboard/org/move-outs/${encodePublicId(noticeId, "move-out-notice")}`);
  revalidatePath("/dashboard/org/notifications");
}
export async function requestArrearsApproval(form: FormData) {
  const session = await requireManagementAccess();
  const noticeId = String(form.get("noticeId") ?? "");
  const reason = String(form.get("approvalReason") ?? "").trim();
  if (!reason || reason.length > 2000) return { ok: false, error: "Explain why handover should proceed with arrears (up to 2,000 characters)." };
  try {
    await prisma.$transaction(async tx => {
      const { notice, settlement, date, key } = await approvalSettlement(tx, session.activeOrgId!, noticeId, form);
      if (settlement.amountOwed <= 0) throw new Error("This settlement has no remaining arrears.");
      const latest = await latestArrearsApproval(tx, session.activeOrgId!, noticeId);
      if (latest?.metadata.key === key && latest.action !== "MOVE_OUT_ARREARS_REJECTED") throw new Error("This settlement is already awaiting approval or has been approved.");
      await tx.auditLog.create({ data: { orgId: session.activeOrgId!, actorUserId: session.userId, entityType: "MoveOutNotice", entityId: noticeId, action: "MOVE_OUT_ARREARS_REQUESTED", metadata: { key, date, reason, ...settlement } } });
      const admins = await tx.membership.findMany({ where: { orgId: session.activeOrgId!, OR: [{ role: "ADMIN" }, { role: { in: ["MANAGER", "OFFICE", "ACCOUNTANT"] }, grantedPermissions: { has: "move-outs.arrears.approve" } }], deactivatedAt: null, employmentEndedAt: null, user: { status: "ACTIVE", deletedAt: null } }, select: { userId: true } });
      if (!admins.length) throw new Error("No active admin or authorised approver is available to approve this request.");
      await notifyInAppAndPush({ db: tx, orgId: session.activeOrgId!, actorUserId: session.userId, recipients: admins.map(admin => ({ userId: admin.userId })), type: "GENERAL", title: "Move-out approval required: handover with arrears", message: `${notice.tenant.fullName}: remaining arrears ${settlement.amountOwed.toFixed(2)}. ${reason}`, actionUrl: `/dashboard/org/move-outs/${encodePublicId(noticeId, "move-out-notice")}` });
    }, { isolationLevel: "Serializable" });
    refresh(noticeId);
    return { ok: true };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Could not request approval." }; }
}
export async function decideArrearsApproval(form: FormData) {
  const session = await requireOrgPermission("move-outs.arrears.approve");
  const noticeId = String(form.get("noticeId") ?? "");
  const decision = String(form.get("decision") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  if (!["APPROVED", "REJECTED"].includes(decision) || !reason || reason.length > 2000) return { ok: false, error: "Choose a decision and enter an admin review note (up to 2,000 characters)." };
  try {
    await prisma.$transaction(async tx => {
      const latest = await latestArrearsApproval(tx, session.activeOrgId!, noticeId);
      if (!latest || latest.action !== "MOVE_OUT_ARREARS_REQUESTED" || latest.id !== form.get("requestId")) throw new Error("This request has changed. Refresh before reviewing.");
      const snapshot = new FormData();
      snapshot.set("actualMoveOutDate", String(latest.metadata.date));
      snapshot.set("costItems", JSON.stringify(latest.metadata.itemisedCosts));
      const current = await approvalSettlement(tx, session.activeOrgId!, noticeId, snapshot);
      if (current.key !== latest.metadata.key) throw new Error("Settlement balances have changed. Ask management to submit a fresh request.");
      await tx.auditLog.create({ data: { orgId: session.activeOrgId!, actorUserId: session.userId, entityType: "MoveOutNotice", entityId: noticeId, action: `MOVE_OUT_ARREARS_${decision}`, metadata: { ...latest.metadata, requestId: latest.id, reviewNote: reason } } });
      const request = await tx.auditLog.findUnique({ where: { id: latest.id }, select: { actorUserId: true } });
      if (request?.actorUserId) await notifyInAppAndPush({ db: tx, orgId: session.activeOrgId!, actorUserId: session.userId, recipients: [{ userId: request.actorUserId }], type: "GENERAL", title: `Arrears handover ${decision.toLowerCase()}`, message: `${current.notice.tenant.fullName}: ${reason}`, actionUrl: `/dashboard/org/move-outs/${encodePublicId(noticeId, "move-out-notice")}` });
    }, { isolationLevel: "Serializable" });
    refresh(noticeId);
    return { ok: true };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Could not save the admin decision." }; }
}
