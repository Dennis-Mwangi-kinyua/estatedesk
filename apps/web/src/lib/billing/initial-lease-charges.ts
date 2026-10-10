import "server-only";
import { Prisma } from "@prisma/client";
import { nairobiDate } from "@/lib/move-outs/validation";
import { postRentChargeAccrual } from "@/lib/accounting/billing";

/** Initial rent and refundable deposit are posted atomically with a new lease. */
export async function createInitialLeaseCharges(db: Prisma.TransactionClient, lease: {
  id: string; orgId: string; startDate: Date; monthlyRent: Prisma.Decimal; deposit: Prisma.Decimal | null;
}, chargeTypes: readonly ("RENT" | "DEPOSIT")[] = ["RENT", "DEPOSIT"]) {
  const period = nairobiDate(lease.startDate).slice(0, 7);
  for (const [chargeType, value, description] of [
    ["RENT", lease.monthlyRent, "First month rent"],
    ["DEPOSIT", lease.deposit, "Refundable security deposit"],
  ] as const) {
    if (!chargeTypes.includes(chargeType)) continue;
    const amount = new Prisma.Decimal(value ?? 0);
    if (amount.lte(0)) continue;
    const charge = await db.rentCharge.upsert({
      where: { leaseId_period_chargeType: { leaseId: lease.id, period, chargeType } }, update: {},
      create: { orgId: lease.orgId, leaseId: lease.id, period, chargeType, description,
        amountDue: amount, amountPaid: 0, balance: amount, dueDate: lease.startDate, status: "UNPAID" },
    });
    // Deposits become held funds when payment is received, rather than rental income.
    if (chargeType === "RENT") await postRentChargeAccrual(db, charge.id);
  }
}
