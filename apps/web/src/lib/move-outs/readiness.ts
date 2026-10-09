import type { Prisma } from "@prisma/client";
import { moneyCents } from "./settlement";
import { nairobiDate } from "./validation";

export async function depositHeldCents(db: Prisma.TransactionClient, lease: { orgId: string; tenantId: string; unitId: string }) {
  const lines = await db.accountingJournalLine.findMany({ where: { orgId: lease.orgId, tenantId: lease.tenantId, unitId: lease.unitId, account: { systemKey: "TENANT_DEPOSITS" }, journal: { status: "POSTED", reversalOfId: null, sourceType: { not: "RENT_CHARGE_ACCRUAL" } } }, select: { debit: true, credit: true } });
  const allocations = await db.paymentAllocation.findMany({ where: { orgId: lease.orgId, rentCharge: { chargeType: "DEPOSIT", lease: { tenantId: lease.tenantId, unitId: lease.unitId } }, payment: { targetType: { not: "DEPOSIT" }, gatewayStatus: "SUCCESS", verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] }, reversedAt: null } }, select: { amount: true } });
  const allocated = allocations.reduce((sum, item) => sum + moneyCents(item.amount.toString(), "deposit allocation"), 0);
  return Math.max(0, allocated + lines.reduce((sum, line) => sum + moneyCents(line.credit.toString(), "deposit credit") - moneyCents(line.debit.toString(), "deposit debit"), 0));
}

export async function finalBillingIssues(db: Prisma.TransactionClient, lease: { id: string; orgId: string; tenantId: string; unitId: string }, handover: Date) {
  const period = nairobiDate(handover).slice(0, 7);
  const [unit, pending, reading, bill, rent, payments] = await Promise.all([
    db.unit.findUniqueOrThrow({ where: { id: lease.unitId }, include: { property: true } }),
    db.waterBill.count({ where: { orgId: lease.orgId, tenantId: lease.tenantId, unitId: lease.unitId, status: { in: ["PENDING_APPROVAL", "DISPUTED", "PAID_PENDING_VERIFICATION"] } } }),
    db.meterReading.findUnique({ where: { unitId_period: { unitId: lease.unitId, period } } }),
    db.waterBill.findUnique({ where: { unitId_period: { unitId: lease.unitId, period } } }),
    db.rentCharge.findUnique({ where: { leaseId_period_chargeType: { leaseId: lease.id, period, chargeType: "RENT" } } }),
    db.payment.count({ where: { orgId: lease.orgId, payerTenantId: lease.tenantId, verificationStatus: "PENDING", gatewayStatus: { in: ["SUCCESS", "PENDING"] } } }),
  ]);
  const issues: string[] = [];
  if (pending) issues.push("Resolve all unapproved, disputed, or unverified water bills.");
  if (payments) issues.push("Review pending tenant payments before final settlement.");
  if (!rent) issues.push("Post the final month's rent and review any prorating adjustment.");
  if (unit.property.waterRatePerUnit !== null || unit.property.waterFixedCharge !== null) {
    if (!reading || reading.status !== "APPROVED" || reading.updatedAt < handover) issues.push("Record and approve the final handover meter reading for this month.");
    if (!bill || bill.tenantId !== lease.tenantId || !["ISSUED", "PAYMENT_PENDING", "PAID_VERIFIED"].includes(bill.status)) issues.push("Issue the approved final water bill to this tenant.");
  }
  return issues;
}
