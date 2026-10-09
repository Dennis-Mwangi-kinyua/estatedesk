import type { Prisma } from "@prisma/client";
import { moneyCents } from "./settlement";
export async function loadMoveOutBalances(db: Prisma.TransactionClient, lease: { id: string; orgId: string; tenantId: string; unitId: string }) {
  const [charges, waterBills] = await Promise.all([
    db.rentCharge.findMany({ where: { leaseId: lease.id, orgId: lease.orgId, chargeType: { not: "DEPOSIT" }, status: { not: "WAIVED" }, balance: { gt: 0 } }, orderBy: [{ dueDate: "asc" }, { id: "asc" }] }),
    db.waterBill.findMany({ where: { orgId: lease.orgId, tenantId: lease.tenantId, unitId: lease.unitId, status: { in: ["ISSUED", "PAYMENT_PENDING"] } }, orderBy: [{ dueDate: "asc" }, { id: "asc" }] }),
  ]);
  const water = waterBills.map(bill => ({ ...bill, remainingCents: Math.max(0, moneyCents(bill.total.toString(), "water total") - moneyCents(bill.amountPaid.toString(), "water paid")) })).filter(bill => bill.remainingCents > 0);
  const chargeCents = charges.reduce((sum, charge) => sum + moneyCents(charge.balance.toString(), "bill balance"), 0);
  return { charges, water, totalCents: chargeCents + water.reduce((sum, bill) => sum + bill.remainingCents, 0) };
}
