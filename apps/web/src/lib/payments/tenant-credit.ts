import "server-only";
import { Prisma } from "@prisma/client";
import { getCurrentPeriod } from "@/lib/ledger-utils";
import { postRentChargeAccrual } from "@/lib/accounting/billing";
import { postJournalEntry } from "@/lib/accounting/engine";
import { getAccountingSettings, usesAccrualRecognition } from "@/lib/accounting/settings";

export async function applyTenantCredit(tx: Prisma.TransactionClient, orgId: string, tenantId: string, period = getCurrentPeriod()) {
  const credits = await tx.payment.findMany({ where: { orgId, payerTenantId: tenantId, verificationStatus: "VERIFIED", gatewayStatus: "SUCCESS", reversedAt: null, unappliedAmount: { gt: 0 } }, orderBy: [{ paidAt: "asc" }, { id: "asc" }] });
  let applied = new Prisma.Decimal(0);
  for (const payment of credits) {
    const metadata = payment.callbackRaw && typeof payment.callbackRaw === "object" && !Array.isArray(payment.callbackRaw) ? payment.callbackRaw : {};
    const origin = String(metadata.creditOriginPeriod ?? metadata.period ?? payment.coveredPeriods[0] ?? (payment.paidAt ?? payment.createdAt).toISOString().slice(0, 7));
    if (period <= origin) continue;
    const [year, month] = period.split("-").map(Number);
    const lease = await tx.lease.findFirst({ where: { orgId, tenantId, status: "ACTIVE", deletedAt: null, startDate: { lt: new Date(Date.UTC(year, month, 1)) } }, orderBy: { startDate: "desc" }, include: { unit: true } });
    if (!lease) continue;
    const dueDate = new Date(Date.UTC(year, month - 1, Math.min(lease.dueDay, new Date(Date.UTC(year, month, 0)).getUTCDate())));
    for (const [chargeType, amount, description] of [
      ["RENT", lease.monthlyRent, "Monthly rent"], ["SERVICE_CHARGE", lease.unit.serviceCharge, "Monthly service charge"],
      ["OTHER", lease.unit.garbageFee, "Monthly garbage fee"], ["SECURITY", lease.unit.securityFee, "Monthly security fee"],
    ] as const) {
      if (!amount || new Prisma.Decimal(amount).lte(0)) continue;
      const charge = await tx.rentCharge.upsert({ where: { leaseId_period_chargeType: { leaseId: lease.id, period, chargeType } }, update: {}, create: { orgId, leaseId: lease.id, period, chargeType, description, amountDue: amount, amountPaid: 0, balance: amount, status: "UNPAID", dueDate } });
      await postRentChargeAccrual(tx, charge.id);
    }
    const charges = await tx.rentCharge.findMany({ where: { orgId, leaseId: lease.id, period: { gt: origin, lte: period }, chargeType: { not: "DEPOSIT" }, balance: { gt: 0 }, status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] } }, orderBy: [{ dueDate: "asc" }, { id: "asc" }] });
    const water = await tx.waterBill.findMany({ where: { orgId, tenantId, unitId: lease.unitId, period: { gt: origin, lte: period }, balance: { gt: 0 }, status: { in: ["ISSUED", "DISPUTED"] } }, orderBy: [{ dueDate: "asc" }, { id: "asc" }] });
    let remaining = payment.unappliedAmount;
    const coveredPeriods = new Set(payment.coveredPeriods);
    const waterUses: Prisma.InputJsonObject[] = Array.isArray(metadata.creditWaterApplications) ? metadata.creditWaterApplications as Prisma.InputJsonObject[] : [];
    const settings = await getAccountingSettings(tx, orgId);
    const targets = [...charges.map(charge => ({ kind: "charge" as const, id: charge.id, period: charge.period, balance: charge.balance, dueDate: charge.dueDate, incomeKey: charge.chargeType === "RENT" ? "RENT_INCOME" : charge.chargeType === "SERVICE_CHARGE" ? "SERVICE_INCOME" : "OTHER_INCOME" })), ...water.map(bill => ({ kind: "water" as const, id: bill.id, period: bill.period, balance: bill.balance, dueDate: bill.dueDate, incomeKey: "WATER_INCOME" }))].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime() || a.id.localeCompare(b.id));
    for (const target of targets) {
      if (remaining.lte(0)) break;
      const amount = Prisma.Decimal.min(remaining, target.balance);
      const nextBalance = target.balance.sub(amount);
      const sourceId = `${payment.id}:credit:${target.id}:${remaining.toFixed(2)}`;
      if (target.kind === "charge") {
        await tx.paymentAllocation.upsert({ where: { paymentId_rentChargeId: { paymentId: payment.id, rentChargeId: target.id } }, update: { amount: { increment: amount } }, create: { orgId, paymentId: payment.id, rentChargeId: target.id, period: target.period, amount } });
        await tx.rentCharge.update({ where: { id: target.id }, data: { amountPaid: { increment: amount }, balance: nextBalance, status: nextBalance.lte(0) ? "PAID" : "PARTIAL" } });
      } else {
        await tx.waterBill.update({ where: { id: target.id }, data: { amountPaid: { increment: amount }, balance: nextBalance, status: nextBalance.lte(0) ? "PAID_VERIFIED" : "ISSUED" } });
        waterUses.push({ waterBillId: target.id, amount: amount.toFixed(2), period: target.period, sourceId });
      }
      if (settings.autoPostPayments) {
        await postJournalEntry({ db: tx, orgId, entryDate: new Date(), description: "Tenant credit applied to billing", sourceType: "ADJUSTMENT", sourceId, lines: [{ systemKey: "TENANT_CREDITS", debit: amount, tenantId, unitId: lease.unitId, propertyId: lease.unit.propertyId }, { systemKey: usesAccrualRecognition(settings) ? "TENANT_RECEIVABLES" : target.incomeKey, credit: amount, tenantId, unitId: lease.unitId, propertyId: lease.unit.propertyId }] });
      }
      coveredPeriods.add(target.period);
      remaining = remaining.sub(amount);
      applied = applied.add(amount);
    }
    await tx.payment.update({ where: { id: payment.id }, data: { unappliedAmount: remaining, coveredPeriods: [...coveredPeriods], callbackRaw: { ...metadata, creditOriginPeriod: origin, creditWaterApplications: waterUses } } });
  }
  return applied;
}

/** Read paths may race the daily credit job; retry serialization conflicts. */
export async function applyTenantCreditWithRetry(db: import("@prisma/client").PrismaClient, orgId: string, tenantId: string) {
  for (let attempt = 0; ; attempt++) {
    try { return await db.$transaction(tx => applyTenantCredit(tx, orgId, tenantId), { isolationLevel: "Serializable", timeout: 30_000 }); }
    catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt >= 3) throw error;
    }
  }
}
