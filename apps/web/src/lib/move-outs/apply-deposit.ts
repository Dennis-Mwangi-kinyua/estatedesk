import { Prisma } from "@prisma/client";
import { loadMoveOutBalances } from "./balances";
import { moneyCents } from "./settlement";
import { postVerifiedPayment } from "@/lib/accounting/payments";
import { issueDocumentRecord } from "@/lib/documents/registry";
import { createReceiptSnapshot } from "@/lib/documents/receipt-snapshot";

export async function applyMoveOutDeposit(tx: Prisma.TransactionClient, input: { noticeId: string; lease: { id: string; orgId: string; tenantId: string; unitId: string }; amount: number; actorUserId: string }) {
  if (input.amount <= 0) return null;
  const balances = await loadMoveOutBalances(tx, input.lease);
  const payment = await tx.payment.create({ data: { orgId: input.lease.orgId, payerTenantId: input.lease.tenantId, method: "DEPOSIT_OFFSET", amount: input.amount, targetType: "COMBINED", gatewayStatus: "SUCCESS", verificationStatus: "VERIFIED", reconciliationStatus: "RECONCILED", paidAt: new Date(), reconciledAt: new Date(), reconciledByUserId: input.actorUserId, reconciliationNotes: "Deposit applied at move-out handover", reference: `MOVEOUT-${input.noticeId}`, transactionReferenceKey: `DEPOSIT_OFFSET:${input.noticeId}`, callbackRaw: { source: "move_out_deposit", leaseId: input.lease.id, noticeId: input.noticeId }, notes: "Existing tenant deposit applied to final bills and agreed move-out costs. No new cash received." } });
  let remaining = moneyCents(input.amount, "deposit applied");
  const periods = new Set<string>();
  for (const charge of balances.charges) {
    if (remaining <= 0) break;
    const open = moneyCents(charge.balance.toString(), "balance");
    const apply = Math.min(remaining, open);
    await tx.paymentAllocation.create({ data: { orgId: input.lease.orgId, paymentId: payment.id, rentChargeId: charge.id, period: charge.period, amount: apply / 100 } });
    await tx.rentCharge.update({ where: { id: charge.id }, data: { amountPaid: { increment: apply / 100 }, balance: (open - apply) / 100, status: open === apply ? "PAID" : "PARTIAL" } });
    remaining -= apply; periods.add(charge.period);
  }
  for (const bill of balances.water) {
    if (remaining <= 0) break;
    const apply = Math.min(remaining, bill.remainingCents);
    // Water balances use their own running amountPaid; record each split for audit/reversal.
    await tx.waterBill.update({ where: { id: bill.id }, data: { amountPaid: { increment: apply / 100 }, balance: (bill.remainingCents - apply) / 100, status: bill.remainingCents === apply ? "PAID_VERIFIED" : "ISSUED" } });
    await tx.auditLog.create({ data: { orgId: input.lease.orgId, actorUserId: input.actorUserId, action: "MOVE_OUT_WATER_DEPOSIT_APPLIED", entityType: "WaterBill", entityId: bill.id, metadata: { paymentId: payment.id, noticeId: input.noticeId, amount: apply / 100 } } });
    remaining -= apply; periods.add(bill.period);
  }
  if (remaining !== 0) throw new Error("Final balances changed while applying the deposit. Refresh and try again.");
  await tx.payment.update({ where: { id: payment.id }, data: { coveredPeriods: [...periods], rentChargeId: balances.charges[0]?.id ?? null, callbackRaw: { source: "move_out_deposit", leaseId: input.lease.id, noticeId: input.noticeId, waterAllocations: balances.water.map(bill => ({ billId: bill.id, outstandingBefore: bill.remainingCents / 100 })) } } });
  await postVerifiedPayment(tx, payment.id, input.actorUserId);
  const document = await issueDocumentRecord({ db: tx, orgId: input.lease.orgId, documentType: "RECEIPT", entityType: "Payment", entityId: payment.id, title: "Move-out deposit application", issuedByUserId: input.actorUserId, metadata: { noticeId: input.noticeId, paymentId: payment.id } });
  await tx.receipt.create({ data: { paymentId: payment.id, documentId: document.id, receiptNo: document.serialNumber } });
  const snapshot = await createReceiptSnapshot(tx, payment.id, input.actorUserId);
  await tx.documentRecord.update({ where: { id: document.id }, data: { metadata: { noticeId: input.noticeId, paymentId: payment.id, receiptSnapshot: snapshot } } });
  return payment.id;
}
