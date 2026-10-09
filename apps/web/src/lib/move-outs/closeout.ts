import { depositHeldCents, finalBillingIssues } from "./readiness";
import { loadMoveOutBalances } from "./balances";
import { moneyCents, parseCostItems } from "./settlement";
import { applyMoveOutDeposit } from "./apply-deposit";
import { postJournalEntry } from "@/lib/accounting/engine";
import { postRentChargeAccrual } from "@/lib/accounting/billing";
import type { Prisma } from "@prisma/client";
import { nairobiDate, parseCloseout } from "./validation";
import { recordVacatedTenancy } from "@/lib/tenants/identity";
import { notifyInAppAndPush } from "@/lib/notifications/notify";

export async function closeMoveOut(tx: Prisma.TransactionClient, input: { noticeId: string; orgId: string; actorUserId: string; form: FormData }) {
  const notice = await tx.moveOutNotice.findFirst({ where: { id: input.noticeId, status: "INSPECTION_COMPLETED", lease: { orgId: input.orgId, deletedAt: null } }, include: { inspection: true, tenant: { select: { fullName: true } }, lease: true } });
  if (!notice || notice.inspection?.status !== "COMPLETED") throw new Error("A completed inspection is required before closing this move-out.");
  const balances = await loadMoveOutBalances(tx, notice.lease);
  if (!input.form.has("costItems") || moneyCents(input.form.get("expectedOutstandingBills"), "reviewed bill balance") !== balances.totalCents) throw new Error("Bill balances have changed. Refresh and review the final settlement again.");
  const unapplied = await tx.payment.findFirst({ where: { orgId: input.orgId, payerTenantId: notice.tenantId, verificationStatus: "VERIFIED", unappliedAmount: { gt: 0 } }, select: { id: true } });
  if (unapplied) throw new Error("This tenant has unapplied payment credit. Allocate or refund that credit before closing the account.");
  const { actualMoveOutDate, notes, settlement } = parseCloseout(input.form, new Date(), balances.totalCents);
  if (input.form.get("finalBillingConfirmed") !== "on") throw new Error("Confirm final utility bills and rent adjustments have been posted.");
  const issues = await finalBillingIssues(tx, notice.lease, actualMoveOutDate);
  if (issues.length) throw new Error(issues.join(" "));
  if (moneyCents(settlement.depositHeld, "deposit held") !== await depositHeldCents(tx, notice.lease)) throw new Error("Deposit held must match the posted tenant deposit ledger. Reconcile deposit receipts before closing.");
  if (settlement.refundStatus === "REFUNDED") throw new Error("Close with refund pending, then record the paid refund with proof.");
  if (input.form.get("reportReviewed") !== "on") throw new Error("Generate and review the move-out report before handover.");
  const report = await tx.auditLog.findFirst({ where: { orgId: input.orgId, entityType: "MoveOutNotice", entityId: notice.id, action: "MOVE_OUT_REPORT_GENERATED", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, orderBy: { createdAt: "desc" } });
  if (!report) throw new Error("Generate a fresh move-out report before closing (within 24 hours).");
  const reviewed = report.metadata && typeof report.metadata === "object" && !Array.isArray(report.metadata) ? report.metadata : {};
  if (Number(reviewed.outstandingBills) !== settlement.outstandingBills || Number(reviewed.depositHeld) !== settlement.depositHeld || JSON.stringify(parseCostItems(JSON.stringify(reviewed.itemisedCosts ?? []))) !== JSON.stringify(settlement.itemisedCosts)) throw new Error("Settlement has changed. Generate the report with the current itemised costs and review it again.");
  if (notice.lease.status !== "ACTIVE" || actualMoveOutDate < notice.lease.startDate) throw new Error("The handover date must belong to the active lease.");
  const otherOccupant = await tx.lease.findFirst({ where: { unitId: notice.lease.unitId, id: { not: notice.leaseId }, status: "ACTIVE", deletedAt: null }, select: { id: true } });
  if (otherOccupant) throw new Error("This unit has another active lease. Resolve its occupancy before closing.");
  const claimed = await tx.moveOutNotice.updateMany({ where: { id: notice.id, status: "INSPECTION_COMPLETED" }, data: { status: "CLOSED", actualMoveOutDate, closedAt: new Date(), closeout: { ...settlement, notes, actorUserId: input.actorUserId } } });
  if (claimed.count !== 1) throw new Error("This notice has already changed. Refresh and try again.");
  if (settlement.additionalCosts > 0) {
    const period = nairobiDate(actualMoveOutDate).slice(0, 7);
    const extra = await tx.rentCharge.upsert({ where: { leaseId_period_chargeType: { leaseId: notice.leaseId, period, chargeType: "OTHER" } }, create: { orgId: input.orgId, leaseId: notice.leaseId, period, chargeType: "OTHER", amountDue: settlement.additionalCosts, amountPaid: 0, balance: settlement.additionalCosts, dueDate: actualMoveOutDate, status: "UNPAID", description: `Move-out costs: ${settlement.itemisedCosts.map(item => item.description).join("; ")}` }, update: { amountDue: { increment: settlement.additionalCosts }, balance: { increment: settlement.additionalCosts }, status: "UNPAID" } });
    if (extra.journalEntryId) await postJournalEntry({ db: tx, orgId: input.orgId, entryDate: actualMoveOutDate, description: "Additional move-out costs", sourceType: "ADJUSTMENT", sourceId: `MOVEOUT_COSTS:${notice.id}`, userId: input.actorUserId, lines: [{ systemKey: "TENANT_RECEIVABLES", debit: settlement.additionalCosts, tenantId: notice.tenantId, unitId: notice.lease.unitId }, { systemKey: "OTHER_INCOME", credit: settlement.additionalCosts, tenantId: notice.tenantId, unitId: notice.lease.unitId }] });
    else await postRentChargeAccrual(tx, extra.id);
  }
  // An uncollected deposit is no longer payable after possession is returned.
  const uncollectedDeposits = await tx.rentCharge.findMany({ where: { leaseId: notice.leaseId, chargeType: "DEPOSIT", balance: { gt: 0 }, status: { not: "WAIVED" } } });
  for (const charge of uncollectedDeposits) {
    if (charge.journalEntryId) await postJournalEntry({ db: tx, orgId: input.orgId, entryDate: actualMoveOutDate, description: "Cancel uncollected deposit at move-out", sourceType: "RENT_CHARGE_ACCRUAL", sourceId: `MOVEOUT_DEPOSIT_WAIVER:${charge.id}`, userId: input.actorUserId, lines: [{ systemKey: "TENANT_DEPOSITS", debit: charge.balance, tenantId: notice.tenantId, unitId: notice.lease.unitId }, { systemKey: "TENANT_RECEIVABLES", credit: charge.balance, tenantId: notice.tenantId, unitId: notice.lease.unitId }] });
    await tx.rentCharge.update({ where: { id: charge.id }, data: { status: "WAIVED", balance: 0, description: `${charge.description ?? "Deposit"} — uncollected balance cancelled at move-out` } });
  }
  const depositPaymentId = await applyMoveOutDeposit(tx, { noticeId: notice.id, lease: notice.lease, amount: settlement.deductions, actorUserId: input.actorUserId });
  const finalBalances = await loadMoveOutBalances(tx, notice.lease);
  if (finalBalances.totalCents !== moneyCents(settlement.amountOwed, "amount owed")) throw new Error("Final settlement did not match the bill ledger. Refresh and try again.");
  await tx.moveOutNotice.update({ where: { id: notice.id }, data: { closeout: { ...settlement, notes, actorUserId: input.actorUserId, depositPaymentId, settlementVersion: 2 } } });
  await recordVacatedTenancy(tx, { tenantId: notice.tenantId, leaseId: notice.leaseId, moveOutNoticeId: notice.id, actorUserId: input.actorUserId, notes });
  if (input.form.get("unitReady") !== "on") await tx.unit.update({ where: { id: notice.lease.unitId }, data: { status: "UNDER_MAINTENANCE" } });
  await tx.tenantHistoryRecord.updateMany({ where: { tenantId: notice.tenantId, leaseId: notice.leaseId, moveOutNoticeId: notice.id }, data: { status: "ARCHIVED", notes } });
  await notifyInAppAndPush({ actorUserId: input.actorUserId, db: tx, orgId: input.orgId, recipients: [{ tenantId: notice.tenantId }], type: "MOVE_OUT_CLOSED", title: "Move-out closed", message: `Your handover has been confirmed. Remaining amount owed: ${settlement.amountOwed.toFixed(2)}. Deposit refund due: ${settlement.refundDue.toFixed(2)}; status: ${settlement.refundStatus.toLowerCase()}. ${notes}` });
  await tx.auditLog.create({ data: { orgId: input.orgId, actorUserId: input.actorUserId, action: "MOVE_OUT_CLOSED", entityType: "MoveOutNotice", entityId: notice.id, metadata: { ...settlement, notes, actualMoveOutDate: actualMoveOutDate.toISOString() } } });
}
