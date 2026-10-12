import { settlementApprovalKey } from "./arrears-approval-key";
export { settlementApprovalKey } from "./arrears-approval-key";
import type { Prisma } from "@prisma/client";
import { calculateSettlement, parseCostItems } from "./settlement";
import { loadMoveOutBalances } from "./balances";
import { depositHeldCents } from "./readiness";
import { parseMoveOutDate, nairobiDate } from "./validation";

export const approvalActions = ["MOVE_OUT_ARREARS_REQUESTED", "MOVE_OUT_ARREARS_APPROVED", "MOVE_OUT_ARREARS_REJECTED"];
export async function latestArrearsApproval(db: Pick<Prisma.TransactionClient, "auditLog">, orgId: string, noticeId: string) {
  const event = await db.auditLog.findFirst({ where: { orgId, entityType: "MoveOutNotice", entityId: noticeId, action: { in: approvalActions } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
  const metadata = event?.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata) ? event.metadata : {};
  return event ? { id: event.id, action: event.action, metadata } : null;
}
export async function approvalSettlement(db: Prisma.TransactionClient, orgId: string, noticeId: string, form: FormData) {
  const notice = await db.moveOutNotice.findFirst({ where: { id: noticeId, status: "INSPECTION_COMPLETED", lease: { orgId, status: "ACTIVE", deletedAt: null } }, include: { lease: true, inspection: true, tenant: { select: { fullName: true } } } });
  if (!notice || notice.inspection?.status !== "COMPLETED") throw new Error("Complete the inspection before requesting arrears approval.");
  const date = parseMoveOutDate(String(form.get("actualMoveOutDate") ?? ""));
  if (date < notice.lease.startDate || nairobiDate(date) > nairobiDate()) throw new Error("Choose a handover date within the active lease and no later than today.");
  const balances = await loadMoveOutBalances(db, notice.lease);
  const settlement = calculateSettlement(await depositHeldCents(db, notice.lease), balances.totalCents, parseCostItems(form.get("costItems")));
  return { notice, settlement, date: nairobiDate(date), key: settlementApprovalKey(settlement, nairobiDate(date)) };
}

export async function requireArrearsApproval(db: Pick<Prisma.TransactionClient, "auditLog">, orgId: string, noticeId: string, settlement: ReturnType<typeof calculateSettlement>, date: string) {
  if (settlement.amountOwed <= 0) return;
  const approval = await latestArrearsApproval(db, orgId, noticeId);
  if (approval?.action !== "MOVE_OUT_ARREARS_APPROVED" || approval.metadata.key !== settlementApprovalKey(settlement, date)) throw new Error("An admin or authorised approver must approve this settlement with arrears before handover. Submit a fresh request if the settlement has changed.");
}
