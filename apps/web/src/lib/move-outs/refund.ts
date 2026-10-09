import type { Prisma } from "@prisma/client";
import { postJournalEntry } from "@/lib/accounting/engine";
import { notifyInAppAndPush } from "@/lib/notifications/notify";

export async function recordMoveOutRefund(tx: Prisma.TransactionClient, input: { noticeId: string; orgId: string; actorUserId: string; reference: string; method: string; proofAssetId: string }) {
  const reference = input.reference.trim().toUpperCase();
  if (!reference || reference.length > 200 || !["CASH", "BANK", "MPESA"].includes(input.method)) throw new Error("Valid refund reference and payment method are required.");
  const notice = await tx.moveOutNotice.findFirst({ where: { id: input.noticeId, status: "CLOSED", lease: { orgId: input.orgId } }, include: { lease: true } });
  const closeout = notice?.closeout;
  if (!notice || !closeout || typeof closeout !== "object" || Array.isArray(closeout) || closeout.refundStatus !== "PENDING") throw new Error("This move-out has no pending deposit refund.");
  const proof = await tx.asset.findFirst({ where: { id: input.proofAssetId, orgId: input.orgId, unitId: notice.lease.unitId, deletedAt: null } });
  if (!proof) throw new Error("Valid refund payment proof is required.");
  const amount = Number(closeout.refundDue);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid refund amount.");
  const duplicate = await tx.auditLog.findFirst({ where: { orgId: input.orgId, action: "MOVE_OUT_REFUND_RECORDED", metadata: { path: ["reference"], equals: reference } } });
  if (duplicate) throw new Error("This refund reference has already been used.");
  const journal = await postJournalEntry({ db: tx, orgId: input.orgId, entryDate: new Date(), description: "Tenant move-out deposit refund", memo: reference, sourceType: "ADJUSTMENT", sourceId: `MOVEOUT_REFUND:${notice.id}`, userId: input.actorUserId, lines: [{ systemKey: "TENANT_DEPOSITS", debit: amount, tenantId: notice.tenantId, unitId: notice.lease.unitId }, { systemKey: input.method, credit: amount, tenantId: notice.tenantId, unitId: notice.lease.unitId }] });
  await tx.moveOutNotice.update({ where: { id: notice.id }, data: { closeout: { ...closeout, refundStatus: "REFUNDED", refundReference: reference, refundRecordedAt: new Date().toISOString(), refundRecordedBy: input.actorUserId, refundProofAssetId: proof.id, refundProofUrl: `/api/move-outs/${notice.id}/refund-proof`, refundMethod: input.method, refundJournalId: journal.id } } });
  await tx.auditLog.create({ data: { orgId: input.orgId, actorUserId: input.actorUserId, action: "MOVE_OUT_REFUND_RECORDED", entityType: "MoveOutNotice", entityId: notice.id, metadata: { reference, amount, proofAssetId: proof.id, method: input.method } } });
  await notifyInAppAndPush({ actorUserId: input.actorUserId, db: tx, orgId: input.orgId, recipients: [{ tenantId: notice.tenantId }], type: "GENERAL", title: "Deposit refund recorded", message: `Your deposit refund was recorded as paid. Reference: ${reference}`, actionUrl: "/dashboard/tenant/notices" });
}
