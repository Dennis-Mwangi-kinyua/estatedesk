import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";
import { postRentChargeAccrual } from "@/lib/accounting/billing";
import { dueDateForPeriod } from "@/lib/billing/period-dates";
import { prisma } from "@/lib/prisma";
import { OPENING_ARREARS_PREFIX } from "@/lib/tenants/opening-arrears";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Create the rent, service, garbage, and security rows for one lease period.
 * Existing rows are left unchanged. Opening-arrears periods are skipped, matching payment allocation.
 */
export async function ensureLeasePeriodCharges(
  db: Db,
  input: { orgId: string; leaseId: string; period: string },
): Promise<{ issued: boolean }> {
  const lease = await db.lease.findFirst({
    where: { id: input.leaseId, orgId: input.orgId, deletedAt: null, status: "ACTIVE" },
    select: {
      id: true,
      dueDay: true,
      monthlyRent: true,
      unit: { select: { serviceCharge: true, garbageFee: true, securityFee: true } },
    },
  });
  if (!lease) return { issued: false };

  const openingCharge = await db.rentCharge.findFirst({
    where: {
      orgId: input.orgId,
      leaseId: lease.id,
      period: input.period,
      chargeType: "OTHER",
      description: { startsWith: OPENING_ARREARS_PREFIX },
    },
    select: { id: true },
  });
  if (openingCharge) return { issued: false };

  const existingRent = await db.rentCharge.findUnique({
    where: { leaseId_period_chargeType: { leaseId: lease.id, period: input.period, chargeType: "RENT" } },
    select: { id: true },
  });
  const dueDate = dueDateForPeriod(input.period, lease.dueDay);

  const rentCharge = await db.rentCharge.upsert({
    where: { leaseId_period_chargeType: { leaseId: lease.id, period: input.period, chargeType: "RENT" } },
    update: {},
    create: {
      orgId: input.orgId,
      leaseId: lease.id,
      period: input.period,
      amountDue: lease.monthlyRent,
      amountPaid: 0,
      balance: lease.monthlyRent,
      dueDate,
      chargeType: "RENT",
      status: "UNPAID",
    },
    select: { id: true },
  });

  try {
    await postRentChargeAccrual(db, rentCharge.id);
  } catch {
    // Accrual posting is best-effort until accounting is initialized.
  }

  const recurring: Array<{ chargeType: "SERVICE_CHARGE" | "OTHER" | "SECURITY"; amount: Prisma.Decimal; description: string }> = [];
  const serviceAmount = new Prisma.Decimal(lease.unit.serviceCharge ?? 0);
  const garbageAmount = new Prisma.Decimal(lease.unit.garbageFee ?? 0);
  const securityAmount = new Prisma.Decimal(lease.unit.securityFee ?? 0);
  if (serviceAmount.gt(0)) recurring.push({ chargeType: "SERVICE_CHARGE", amount: serviceAmount, description: "Monthly service charge" });
  if (garbageAmount.gt(0)) recurring.push({ chargeType: "OTHER", amount: garbageAmount, description: "Monthly garbage fee" });
  if (securityAmount.gt(0)) recurring.push({ chargeType: "SECURITY", amount: securityAmount, description: "Monthly security fee" });

  for (const item of recurring) {
    await db.rentCharge.upsert({
      where: { leaseId_period_chargeType: { leaseId: lease.id, period: input.period, chargeType: item.chargeType } },
      update: {},
      create: {
        orgId: input.orgId,
        leaseId: lease.id,
        period: input.period,
        amountDue: item.amount,
        amountPaid: 0,
        balance: item.amount,
        dueDate,
        chargeType: item.chargeType,
        description: item.description,
        status: "UNPAID",
      },
    });
  }

  return { issued: !existingRent };
}

export async function issueOrgPeriodCharges(orgId: string, period: string) {
  const leases = await prisma.lease.findMany({
    where: { orgId, status: "ACTIVE", deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  let created = 0;
  for (const lease of leases) {
    const result = await prisma.$transaction((tx) => ensureLeasePeriodCharges(tx, { orgId, leaseId: lease.id, period }));
    if (result.issued) created += 1;
  }
  return { leases: leases.length, created };
}
