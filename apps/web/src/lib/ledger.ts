import "server-only";

import {
  NotificationChannel,
  NotificationType,
  Prisma,
  type PrismaClient,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyRecipients } from "@/lib/notifications/notify";
import { postRentChargeAccrual } from "@/lib/accounting/billing";
export {
  addMonthsToPeriod,
  daysPastDue,
  formatLedgerCurrency,
  formatLedgerDate,
  getCurrentPeriod,
  toLedgerNumber,
} from "@/lib/ledger-utils";
import {
  addMonthsToPeriod,
  daysPastDue,
  formatLedgerCurrency,
  getCurrentPeriod,
  toLedgerNumber,
} from "@/lib/ledger-utils";
import { partitionChargesAroundWater } from "@/lib/billing/allocation-priority";

type LedgerDb = PrismaClient | Prisma.TransactionClient;
type OrgLedgerOptions = {
  tenantId?: string;
  recentPaymentsTake?: number;
  includeRecentPayments?: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function dueDateForPeriod(period: string, dueDay: number) {
  const [yearValue, monthValue] = period.split("-").map(Number);
  const year = Number.isFinite(yearValue) ? yearValue : new Date().getFullYear();
  const month = Number.isFinite(monthValue) ? monthValue - 1 : new Date().getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  return new Date(year, month, Math.min(Math.max(dueDay, 1), lastDay));
}

export async function allocateRentPayment({
  db,
  orgId,
  paymentId,
  leaseId,
  amount,
  startPeriod = getCurrentPeriod(),
  months = 1,
}: {
  db: LedgerDb;
  orgId: string;
  paymentId: string;
  leaseId: string;
  amount: Prisma.Decimal | number | string;
  startPeriod?: string;
  months?: number;
}) {
  const paymentAmount = new Prisma.Decimal(amount);
  if (paymentAmount.lte(0)) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const lease = await db.lease.findFirst({
    where: {
      id: leaseId,
      orgId,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      id: true,
      dueDay: true,
      monthlyRent: true,
    },
  });

  if (!lease) {
    throw new Error("Active lease not found for rent allocation.");
  }

  let remaining = paymentAmount;
  const coveredPeriods: string[] = [];
  const safeMonths = Math.min(Math.max(months, 1), 36);

  for (let index = 0; index < safeMonths && remaining.gt(0); index += 1) {
    const period = addMonthsToPeriod(startPeriod, index);
    const charge = await db.rentCharge.upsert({
      where: {
        leaseId_period_chargeType: {
          leaseId: lease.id,
          period,
          chargeType: "RENT",
        },
      },
      update: {},
      create: {
        orgId,
        leaseId: lease.id,
        period,
        amountDue: lease.monthlyRent,
        amountPaid: 0,
        balance: lease.monthlyRent,
        dueDate: dueDateForPeriod(period, lease.dueDay),
        chargeType: "RENT",
        status: "UNPAID",
      },
      select: {
        id: true,
        period: true,
        amountDue: true,
        amountPaid: true,
        balance: true,
      },
    });

    try {
      await postRentChargeAccrual(db, charge.id);
    } catch {
      // Accrual posting is best-effort until accounting is initialized.
    }

    const balance = new Prisma.Decimal(charge.balance);
    if (balance.lte(0)) {
      coveredPeriods.push(period);
      continue;
    }

    const allocationAmount = remaining.lt(balance) ? remaining : balance;
    const nextPaid = new Prisma.Decimal(charge.amountPaid).add(allocationAmount);
    const nextBalance = balance.sub(allocationAmount);

    await db.paymentAllocation.upsert({
      where: {
        paymentId_rentChargeId: {
          paymentId,
          rentChargeId: charge.id,
        },
      },
      update: {
        amount: {
          increment: allocationAmount,
        },
      },
      create: {
        orgId,
        paymentId,
        rentChargeId: charge.id,
        period,
        amount: allocationAmount,
      },
    });

    await db.rentCharge.update({
      where: { id: charge.id },
      data: {
        amountPaid: nextPaid,
        balance: nextBalance,
        status: nextBalance.lte(0) ? "PAID" : "PARTIAL",
      },
    });

    remaining = remaining.sub(allocationAmount);
    coveredPeriods.push(period);
  }

  await db.payment.update({
    where: { id: paymentId },
    data: {
      unappliedAmount: remaining,
      coveredPeriods,
    },
  });

  return {
    coveredPeriods,
    unappliedAmount: remaining,
  };
}

/**
 * Apply a verified payment across a period bill with strict hierarchy:
 * service charge → garbage → security → (other fees/penalties) → water → rent last.
 *
 * Used for combined period bills and partial payments so utilities stay current
 * before residual funds reduce rent.
 */
export async function allocateCombinedPeriodPayment({
  db,
  orgId,
  paymentId,
  leaseId,
  period,
  amount,
  waterBillId,
}: {
  db: LedgerDb;
  orgId: string;
  paymentId: string;
  leaseId: string;
  period: string;
  amount: Prisma.Decimal | number | string;
  waterBillId?: string | null;
}) {
  const paymentAmount = new Prisma.Decimal(amount);
  if (paymentAmount.lte(0)) {
    throw new Error("Payment amount must be greater than zero.");
  }

  const lease = await db.lease.findFirst({
    where: {
      id: leaseId,
      orgId,
      deletedAt: null,
    },
    select: {
      id: true,
      dueDay: true,
      monthlyRent: true,
      unitId: true,
      tenantId: true,
      unit: {
        select: {
          serviceCharge: true,
          garbageFee: true,
          securityFee: true,
        },
      },
    },
  });

  if (!lease) {
    throw new Error("Lease not found for combined bill allocation.");
  }

  let remaining = paymentAmount;
  const coveredPeriods = new Set<string>();
  let primaryRentChargeId: string | null = null;
  let appliedWaterBillId: string | null = null;
  let appliedAnyLeaseCharge = false;

  // Ensure a rent charge exists for the period so rent+water can form one bill.
  const rentCharge = await db.rentCharge.upsert({
    where: {
      leaseId_period_chargeType: {
        leaseId: lease.id,
        period,
        chargeType: "RENT",
      },
    },
    update: {},
    create: {
      orgId,
      leaseId: lease.id,
      period,
      amountDue: lease.monthlyRent,
      amountPaid: 0,
      balance: lease.monthlyRent,
      dueDate: dueDateForPeriod(period, lease.dueDay),
      chargeType: "RENT",
      status: "UNPAID",
    },
    select: {
      id: true,
      period: true,
      amountPaid: true,
      balance: true,
      status: true,
    },
  });

  try {
    await postRentChargeAccrual(db, rentCharge.id);
  } catch {
    // Accrual posting is best-effort until accounting is initialized.
  }

  // Unique (leaseId, period, chargeType) limits one row per type.
  // SECURITY has no enum yet — map via description on OTHER/SERVICE_CHARGE.
  const garbageAmount = new Prisma.Decimal(lease.unit.garbageFee ?? 0);
  const securityAmount = new Prisma.Decimal(lease.unit.securityFee ?? 0);
  const serviceAmount = new Prisma.Decimal(lease.unit.serviceCharge ?? 0);

  const recurringCharges: Array<{
    chargeType: "SERVICE_CHARGE" | "OTHER";
    amount: Prisma.Decimal;
    description: string;
  }> = [];

  if (serviceAmount.gt(0) && securityAmount.gt(0) && garbageAmount.gt(0)) {
    recurringCharges.push({
      chargeType: "SERVICE_CHARGE",
      amount: serviceAmount.add(securityAmount),
      description: "Monthly service charge + security fee",
    });
    recurringCharges.push({
      chargeType: "OTHER",
      amount: garbageAmount,
      description: "Monthly garbage fee",
    });
  } else {
    if (serviceAmount.gt(0)) {
      recurringCharges.push({
        chargeType: "SERVICE_CHARGE",
        amount: serviceAmount,
        description: "Monthly service charge",
      });
    } else if (securityAmount.gt(0) && garbageAmount.gt(0)) {
      recurringCharges.push({
        chargeType: "SERVICE_CHARGE",
        amount: securityAmount,
        description: "Monthly security fee",
      });
    }

    if (garbageAmount.gt(0)) {
      recurringCharges.push({
        chargeType: "OTHER",
        amount: garbageAmount,
        description: "Monthly garbage fee",
      });
    } else if (securityAmount.gt(0)) {
      recurringCharges.push({
        chargeType: "OTHER",
        amount: securityAmount,
        description: "Monthly security fee",
      });
    }
  }

  for (const recurring of recurringCharges) {
    await db.rentCharge.upsert({
      where: {
        leaseId_period_chargeType: {
          leaseId: lease.id,
          period,
          chargeType: recurring.chargeType,
        },
      },
      update: {},
      create: {
        orgId,
        leaseId: lease.id,
        period,
        amountDue: recurring.amount,
        amountPaid: 0,
        balance: recurring.amount,
        dueDate: dueDateForPeriod(period, lease.dueDay),
        chargeType: recurring.chargeType,
        description: recurring.description,
        status: "UNPAID",
      },
    });
  }

  const openCharges = await db.rentCharge.findMany({
    where: {
      orgId,
      leaseId: lease.id,
      period,
      status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] },
      balance: { gt: 0 },
    },
    orderBy: [{ dueDate: "asc" }],
    select: {
      id: true,
      period: true,
      chargeType: true,
      description: true,
      amountPaid: true,
      balance: true,
    },
  });

  // Hierarchy: utilities/fees first → water (below) → rent last.
  const { beforeWater, rentLast } = partitionChargesAroundWater(openCharges);

  async function applyToCharge(charge: (typeof openCharges)[number]) {
    if (remaining.lte(0)) return;

    const balance = new Prisma.Decimal(charge.balance);
    if (balance.lte(0)) return;

    const allocationAmount = remaining.lt(balance) ? remaining : balance;
    const nextPaid = new Prisma.Decimal(charge.amountPaid).add(allocationAmount);
    const nextBalance = balance.sub(allocationAmount);

    await db.paymentAllocation.upsert({
      where: {
        paymentId_rentChargeId: {
          paymentId,
          rentChargeId: charge.id,
        },
      },
      update: {
        amount: { increment: allocationAmount },
      },
      create: {
        orgId,
        paymentId,
        rentChargeId: charge.id,
        period: charge.period,
        amount: allocationAmount,
      },
    });

    await db.rentCharge.update({
      where: { id: charge.id },
      data: {
        amountPaid: nextPaid,
        balance: nextBalance,
        status: nextBalance.lte(0) ? "PAID" : "PARTIAL",
      },
    });

    appliedAnyLeaseCharge = true;
    if (charge.chargeType === "RENT") {
      primaryRentChargeId = charge.id;
    } else if (!primaryRentChargeId) {
      primaryRentChargeId = charge.id;
    }
    coveredPeriods.add(charge.period);
    remaining = remaining.sub(allocationAmount);
  }

  for (const charge of beforeWater) {
    await applyToCharge(charge);
  }

  // Apply remainder to water bill before rent.
  if (remaining.gt(0)) {
    const waterBill = waterBillId
      ? await db.waterBill.findFirst({
          where: {
            id: waterBillId,
            orgId,
            tenantId: lease.tenantId,
            status: { notIn: ["CANCELLED", "PENDING_APPROVAL"] },
          },
          select: {
            id: true,
            period: true,
            total: true,
            amountPaid: true,
            balance: true,
            status: true,
          },
        })
      : await db.waterBill.findFirst({
          where: {
            orgId,
            unitId: lease.unitId,
            tenantId: lease.tenantId,
            period,
            status: { notIn: ["CANCELLED", "PENDING_APPROVAL"] },
          },
          select: {
            id: true,
            period: true,
            total: true,
            amountPaid: true,
            balance: true,
            status: true,
          },
        });

    if (waterBill) {
      const waterBalance = new Prisma.Decimal(
        waterBill.balance != null && Number(waterBill.balance) > 0
          ? waterBill.balance
          : waterBill.status === "PAID_VERIFIED"
            ? 0
            : waterBill.total,
      );

      if (waterBalance.gt(0)) {
        const allocationAmount = remaining.lt(waterBalance)
          ? remaining
          : waterBalance;
        const nextPaid = new Prisma.Decimal(waterBill.amountPaid ?? 0).add(
          allocationAmount,
        );
        const nextBalance = waterBalance.sub(allocationAmount);
        const fullyPaid = nextBalance.lte(0);

        await db.waterBill.update({
          where: { id: waterBill.id },
          data: {
            amountPaid: nextPaid,
            balance: nextBalance.lt(0) ? new Prisma.Decimal(0) : nextBalance,
            status: fullyPaid
              ? "PAID_VERIFIED"
              : waterBill.status === "PAID_PENDING_VERIFICATION"
                ? "ISSUED"
                : waterBill.status === "PAID_VERIFIED"
                  ? "PAID_VERIFIED"
                  : "ISSUED",
          },
        });

        appliedWaterBillId = waterBill.id;
        coveredPeriods.add(waterBill.period);
        remaining = remaining.sub(allocationAmount);
      }
    }
  }

  // Rent (and deposits) receive residual funds last.
  for (const charge of rentLast) {
    await applyToCharge(charge);
  }

  // Prefer linking payment.rentChargeId to the RENT row when any rent was open.
  const rentRow = openCharges.find((c) => c.chargeType === "RENT");
  if (rentRow) {
    primaryRentChargeId = rentRow.id;
  }

  await db.payment.update({
    where: { id: paymentId },
    data: {
      unappliedAmount: remaining,
      coveredPeriods: [...coveredPeriods],
      ...(primaryRentChargeId ? { rentChargeId: primaryRentChargeId } : {}),
      ...(appliedWaterBillId ? { waterBillId: appliedWaterBillId } : {}),
      targetType:
        appliedAnyLeaseCharge && appliedWaterBillId
          ? "COMBINED"
          : appliedWaterBillId && !appliedAnyLeaseCharge
            ? "WATER"
            : "RENT",
    },
  });

  return {
    coveredPeriods: [...coveredPeriods],
    unappliedAmount: remaining,
    rentChargeId: primaryRentChargeId,
    waterBillId: appliedWaterBillId,
  };
}

function isRecognizedPayment(payment: {
  gatewayStatus: string;
  verificationStatus: string;
}) {
  return (
    payment.gatewayStatus === "SUCCESS" ||
    payment.verificationStatus === "VERIFIED" ||
    payment.verificationStatus === "NOT_REQUIRED"
  );
}

function dueTone(days: number, balance: number) {
  if (balance <= 0) return "settled";
  if (days > 5) return "default";
  if (days > 0) return "overdue";
  return "due";
}

function monthlyRange(period: string) {
  const [yearValue, monthValue] = period.split("-").map(Number);
  const year = Number.isFinite(yearValue) ? yearValue : new Date().getFullYear();
  const month = Number.isFinite(monthValue) ? monthValue - 1 : new Date().getMonth();

  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 1),
  };
}

export async function getOrgLedger(
  orgId: string,
  period = getCurrentPeriod(),
  options: OrgLedgerOptions = {},
) {
  const { start, end } = monthlyRange(period);
  const includeRecentPayments = options.includeRecentPayments ?? true;
  const recentPaymentsTake = options.recentPaymentsTake ?? 75;

  const [tenants, payments] = await Promise.all([
    prisma.tenant.findMany({
      where: {
        id: options.tenantId,
        orgId,
        deletedAt: null,
      },
      orderBy: {
        fullName: "asc",
      },
      include: {
        leases: {
          where: {
            status: "ACTIVE",
            deletedAt: null,
          },
          select: {
            unit: {
              select: {
                houseNo: true,
                property: { select: { name: true } },
              },
            },
            rentCharges: {
              where: {
                period,
                status: { not: "WAIVED" },
              },
              select: {
                dueDate: true,
                amountDue: true,
                amountPaid: true,
                balance: true,
                chargeType: true,
              },
              orderBy: {
                dueDate: "asc",
              },
            },
          },
        },
        waterBills: {
          where: {
            period,
            status: { not: "CANCELLED" },
          },
          select: {
            dueDate: true,
            total: true,
            payments: {
              select: {
                amount: true,
                gatewayStatus: true,
                verificationStatus: true,
              },
            },
            unit: {
              select: {
                houseNo: true,
                property: { select: { name: true } },
              },
            },
          },
        },
        payments: {
          where: {
            createdAt: {
              gte: start,
              lt: end,
            },
          },
          select: {
            amount: true,
            gatewayStatus: true,
            verificationStatus: true,
            paidAt: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    }),
    includeRecentPayments
      ? prisma.payment.findMany({
          where: {
            orgId,
            createdAt: {
              gte: start,
              lt: end,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: recentPaymentsTake,
          select: {
            id: true,
            amount: true,
            method: true,
            payerName: true,
            payerType: true,
            targetType: true,
            gatewayStatus: true,
            verificationStatus: true,
            reconciliationStatus: true,
            reconciledAt: true,
            reconciliationNotes: true,
            reference: true,
            externalReference: true,
            checkoutRequestId: true,
            paidAt: true,
            createdAt: true,
            payerTenant: { select: { fullName: true } },
            payerUser: { select: { fullName: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const rows = tenants.map((tenant) => {
    const rentCharges = tenant.leases.flatMap((lease) =>
      lease.rentCharges.map((charge) => ({
        dueDate: charge.dueDate,
        amountDue: toLedgerNumber(charge.amountDue),
        amountPaid: toLedgerNumber(charge.amountPaid),
        balance: toLedgerNumber(charge.balance),
        label: charge.chargeType,
        unit: lease.unit,
      })),
    );

    const waterBills = tenant.waterBills.map((bill) => {
      const paid = bill.payments
        .filter(isRecognizedPayment)
        .reduce((sum, payment) => sum + toLedgerNumber(payment.amount), 0);

      return {
        dueDate: bill.dueDate,
        amountDue: toLedgerNumber(bill.total),
        amountPaid: paid,
        balance: Math.max(toLedgerNumber(bill.total) - paid, 0),
        label: "WATER",
        unit: bill.unit,
      };
    });

    const obligations = [...rentCharges, ...waterBills];
    const amountDue = obligations.reduce((sum, item) => sum + item.amountDue, 0);
    const amountPaid = obligations.reduce((sum, item) => sum + item.amountPaid, 0);
    const balance = obligations.reduce((sum, item) => sum + item.balance, 0);
    const oldestOpen = obligations.reduce<
      (typeof obligations)[number] | null
    >((oldest, item) => {
      if (item.balance <= 0) return oldest;
      if (!oldest) return item;
      return item.dueDate < oldest.dueDate ? item : oldest;
    }, null);
    const days = oldestOpen ? daysPastDue(oldestOpen.dueDate) : 0;
    const tenantPayments = tenant.payments.filter(isRecognizedPayment);
    const paidThisMonth = tenantPayments.reduce(
      (sum, payment) => sum + toLedgerNumber(payment.amount),
      0,
    );

    let paymentStatus = "Not billed";

    if (amountDue > 0 && balance <= 0) {
      paymentStatus = "Paid in full";
    } else if (amountPaid > 0) {
      paymentStatus = days > 5 ? "Partial default" : "Partial";
    } else if (balance > 0) {
      paymentStatus = days > 5 ? "Default" : days > 0 ? "Overdue" : "Unpaid";
    }

    return {
      tenantId: tenant.id,
      tenantName: tenant.fullName,
      phone: tenant.phone,
      email: tenant.email,
      amountDue,
      amountPaid,
      paidThisMonth,
      balance,
      deficit: Math.max(balance, 0),
      oldestDueDate: oldestOpen?.dueDate ?? null,
      daysPastDue: Math.max(days, 0),
      tone: dueTone(days, balance),
      paymentStatus,
      lastPaymentAt: tenantPayments[0]?.paidAt ?? tenantPayments[0]?.createdAt ?? null,
      propertyName: obligations[0]?.unit.property.name ?? "-",
      unitHouseNo: obligations[0]?.unit.houseNo ?? "-",
      unitLabel:
        obligations[0]?.unit
          ? `${obligations[0].unit.property.name} / Unit ${obligations[0].unit.houseNo}`
          : "-",
    };
  });

  const paidInFull = rows.filter((row) => row.amountDue > 0 && row.balance <= 0);
  const partial = rows.filter((row) => row.amountPaid > 0 && row.balance > 0);
  const defaulted = rows.filter((row) => row.balance > 0 && row.daysPastDue > 5);
  const unpaid = rows.filter((row) => row.amountDue > 0 && row.amountPaid <= 0);

  return {
    period,
    rows,
    recentPayments: payments,
    totals: {
      expected: rows.reduce((sum, row) => sum + row.amountDue, 0),
      paid: rows.reduce((sum, row) => sum + row.amountPaid, 0),
      paidRecorded: payments
        .filter(isRecognizedPayment)
        .reduce((sum, payment) => sum + toLedgerNumber(payment.amount), 0),
      deficit: rows.reduce((sum, row) => sum + row.deficit, 0),
      paidInFull: paidInFull.length,
      partial: partial.length,
      unpaid: unpaid.length,
      defaulted: defaulted.length,
    },
  };
}

export async function getTenantLedger(userId: string, orgId: string) {
  const period = getCurrentPeriod();
  const tenant = await prisma.tenant.findFirst({
    where: { userId, orgId, deletedAt: null },
    select: { id: true },
  });

  if (!tenant) {
    return {
      period,
      row: null,
    };
  }

  const ledger = await getOrgLedger(orgId, period, {
    tenantId: tenant.id,
    includeRecentPayments: false,
  });

  return {
    period,
    row: ledger.rows[0] ?? null,
  };
}

function groupRowsByOrgId<T extends { orgId: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const existing = grouped.get(row.orgId) ?? [];
    existing.push(row);
    grouped.set(row.orgId, existing);
  }

  return grouped;
}

export async function getPlatformPaymentLedger(
  period = getCurrentPeriod(),
  options?: {
    skip?: number;
    take?: number;
    q?: string;
  },
) {
  const { start, end } = monthlyRange(period);
  const where: Prisma.OrganizationWhereInput = {
    deletedAt: null,
    ...(options?.q
      ? {
          OR: [
            { name: { contains: options.q, mode: "insensitive" } },
            { slug: { contains: options.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [totalOrganizations, orgs] = await Promise.all([
    prisma.organization.count({ where }),
    prisma.organization.findMany({
      where,
      orderBy: { name: "asc" },
      skip: options?.skip ?? 0,
      take: options?.take ?? 20,
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
  ]);

  if (orgs.length === 0) {
    return {
      period,
      rows: [],
      totals: {
        organizations: totalOrganizations,
        listedOrganizations: 0,
        paidOrganizations: 0,
        expected: 0,
        paid: 0,
        deficit: 0,
      },
    };
  }

  const orgIds = orgs.map((org) => org.id);

  const [tenantCounts, rentCharges, waterBills, periodPayments] =
    await Promise.all([
      prisma.tenant.groupBy({
        by: ["orgId"],
        where: {
          orgId: { in: orgIds },
          deletedAt: null,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.rentCharge.findMany({
        where: {
          orgId: { in: orgIds },
          period,
          status: { not: "WAIVED" },
        },
        select: {
          orgId: true,
          amountDue: true,
          balance: true,
        },
      }),
      prisma.waterBill.findMany({
        where: {
          orgId: { in: orgIds },
          period,
          status: { not: "CANCELLED" },
        },
        select: {
          id: true,
          orgId: true,
          total: true,
        },
      }),
      prisma.payment.findMany({
        where: {
          orgId: { in: orgIds },
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        select: {
          orgId: true,
          amount: true,
          gatewayStatus: true,
          verificationStatus: true,
          paidAt: true,
          createdAt: true,
        },
      }),
    ]);

  const waterBillIds = waterBills.map((bill) => bill.id);
  const waterBillPayments =
    waterBillIds.length === 0
      ? []
      : await prisma.payment.findMany({
          where: {
            waterBillId: { in: waterBillIds },
          },
          select: {
            waterBillId: true,
            amount: true,
            gatewayStatus: true,
            verificationStatus: true,
          },
        });

  const tenantCountByOrg = new Map(
    tenantCounts.map((entry) => [entry.orgId, entry._count._all]),
  );
  const rentChargesByOrg = groupRowsByOrgId(rentCharges);
  const waterBillsByOrg = groupRowsByOrgId(waterBills);
  const periodPaymentsByOrg = groupRowsByOrgId(periodPayments);
  const waterBillPaymentsByBillId = new Map<
    string,
    Array<(typeof waterBillPayments)[number]>
  >();

  for (const payment of waterBillPayments) {
    if (!payment.waterBillId) continue;

    const existing = waterBillPaymentsByBillId.get(payment.waterBillId) ?? [];
    existing.push(payment);
    waterBillPaymentsByBillId.set(payment.waterBillId, existing);
  }

  const rows = orgs.map((org) => {
    const orgRentCharges = rentChargesByOrg.get(org.id) ?? [];
    const orgWaterBills = waterBillsByOrg.get(org.id) ?? [];
    const orgPeriodPayments = periodPaymentsByOrg.get(org.id) ?? [];

    const rentDue = orgRentCharges.reduce(
      (sum, charge) => sum + toLedgerNumber(charge.amountDue),
      0,
    );
    const rentBalance = orgRentCharges.reduce(
      (sum, charge) => sum + toLedgerNumber(charge.balance),
      0,
    );
    const waterDue = orgWaterBills.reduce(
      (sum, bill) => sum + toLedgerNumber(bill.total),
      0,
    );
    const waterPaid = orgWaterBills.reduce((sum, bill) => {
      const billPayments = waterBillPaymentsByBillId.get(bill.id) ?? [];

      return (
        sum +
        billPayments
          .filter(isRecognizedPayment)
          .reduce(
            (paymentSum, payment) => paymentSum + toLedgerNumber(payment.amount),
            0,
          )
      );
    }, 0);
    const paid = orgPeriodPayments
      .filter(isRecognizedPayment)
      .reduce((sum, payment) => sum + toLedgerNumber(payment.amount), 0);
    const expected = rentDue + waterDue;
    const deficit = Math.max(rentBalance + Math.max(waterDue - waterPaid, 0), 0);

    return {
      orgId: org.id,
      name: org.name,
      slug: org.slug,
      tenantCount: tenantCountByOrg.get(org.id) ?? 0,
      expected,
      paid,
      deficit,
      paymentCount: orgPeriodPayments.length,
      lastPaymentAt:
        orgPeriodPayments
          .filter(isRecognizedPayment)
          .sort(
            (a, b) =>
              (b.paidAt ?? b.createdAt).getTime() -
              (a.paidAt ?? a.createdAt).getTime(),
          )[0]?.paidAt ?? null,
    };
  });

  return {
    period,
    rows,
    totals: {
      organizations: totalOrganizations,
      listedOrganizations: rows.length,
      paidOrganizations: rows.filter((row) => row.paid > 0).length,
      expected: rows.reduce((sum, row) => sum + row.expected, 0),
      paid: rows.reduce((sum, row) => sum + row.paid, 0),
      deficit: rows.reduce((sum, row) => sum + row.deficit, 0),
    },
  };
}

async function recentlyQueuedReminder({
  db,
  tenantId,
  title,
  type,
}: {
  db: LedgerDb;
  tenantId: string;
  title: string;
  type: NotificationType;
}) {
  const since = new Date(Date.now() - DAY_MS);

  const existing = await db.notification.findFirst({
    where: {
      tenantId,
      title,
      type,
      createdAt: {
        gte: since,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(existing);
}

export async function queueDuePaymentNotifications(
  db: LedgerDb = prisma,
  options: { orgId?: string } = {},
) {
  const now = new Date();

  const [rentCharges, waterBills] = await Promise.all([
    db.rentCharge.findMany({
      where: {
        orgId: options.orgId,
        status: { in: ["UNPAID", "PARTIAL", "OVERDUE"] },
        balance: { gt: 0 },
        dueDate: {
          lte: now,
        },
        lease: {
          status: "ACTIVE",
          deletedAt: null,
          tenant: {
            deletedAt: null,
          },
        },
      },
      include: {
        lease: {
          include: {
            tenant: {
              select: {
                id: true,
                userId: true,
                fullName: true,
              },
            },
          },
        },
      },
      take: 100,
    }),
    db.waterBill.findMany({
      where: {
        orgId: options.orgId,
        status: { in: ["ISSUED", "PAYMENT_PENDING"] },
        dueDate: {
          lte: now,
        },
        tenant: {
          deletedAt: null,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            userId: true,
            fullName: true,
          },
        },
        payments: true,
      },
      take: 100,
    }),
  ]);

  let queued = 0;

  for (const charge of rentCharges) {
    const overdueDays = daysPastDue(charge.dueDate, now);
    const warning = overdueDays > 5;
    const type = warning
      ? NotificationType.RENT_OVERDUE_REMINDER
      : NotificationType.RENT_DUE_REMINDER;
    const title = warning ? "Rent payment warning" : "Rent payment due";
    const tenant = charge.lease.tenant;

    if (
      await recentlyQueuedReminder({
        db,
        tenantId: tenant.id,
        title,
        type,
      })
    ) {
      continue;
    }

    const result = await notifyRecipients({
      db,
      orgId: charge.orgId,
      recipients: [{ tenantId: tenant.id, userId: tenant.userId }],
      channels: [
        NotificationChannel.IN_APP,
        NotificationChannel.SMS,
        NotificationChannel.WHATSAPP,
        NotificationChannel.EMAIL,
        NotificationChannel.WEB_PUSH,
      ],
      type,
      title,
      message: warning
        ? `Your ${charge.period} rent balance of ${formatLedgerCurrency(
            charge.balance,
          )} is more than 5 days overdue. Please pay immediately to avoid further action.`
        : `Your ${charge.period} rent balance of ${formatLedgerCurrency(
            charge.balance,
          )} is due. Please pay as soon as possible.`,
    });

    queued += result.count;
  }

  for (const bill of waterBills) {
    const paid = bill.payments
      .filter(isRecognizedPayment)
      .reduce((sum, payment) => sum + toLedgerNumber(payment.amount), 0);
    const balance = Math.max(toLedgerNumber(bill.total) - paid, 0);

    if (balance <= 0) continue;

    const overdueDays = daysPastDue(bill.dueDate, now);
    const warning = overdueDays > 5;
    const title = warning ? "Water bill warning" : "Water bill due";
    const type = warning
      ? NotificationType.RENT_OVERDUE_REMINDER
      : NotificationType.WATER_BILL_ISSUED;

    if (
      await recentlyQueuedReminder({
        db,
        tenantId: bill.tenant.id,
        title,
        type,
      })
    ) {
      continue;
    }

    const result = await notifyRecipients({
      db,
      orgId: bill.orgId,
      recipients: [{ tenantId: bill.tenant.id, userId: bill.tenant.userId }],
      channels: [
        NotificationChannel.IN_APP,
        NotificationChannel.SMS,
        NotificationChannel.WHATSAPP,
        NotificationChannel.EMAIL,
        NotificationChannel.WEB_PUSH,
      ],
      type,
      title,
      message: warning
        ? `Your ${bill.period} water bill balance of ${formatLedgerCurrency(
            balance,
          )} is more than 5 days overdue. Please pay immediately.`
        : `Your ${bill.period} water bill balance of ${formatLedgerCurrency(
            balance,
          )} is due. Please pay as soon as possible.`,
    });

    queued += result.count;
  }

  return { queued };
}
