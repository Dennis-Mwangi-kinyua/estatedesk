import "server-only";

import {
  NotificationChannel,
  NotificationType,
  type Prisma,
  type PrismaClient,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyRecipients } from "@/lib/notifications/notify";

type LedgerDb = PrismaClient | Prisma.TransactionClient;
type OrgLedgerOptions = {
  tenantId?: string;
  recentPaymentsTake?: number;
  includeRecentPayments?: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function toLedgerNumber(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

export function formatLedgerCurrency(value: unknown) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(toLedgerNumber(value));
}

export function formatLedgerDate(value: Date | string | null | undefined) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function getCurrentPeriod(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function daysPastDue(dueDate: Date, now = new Date()) {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return Math.floor((startOfToday.getTime() - due.getTime()) / DAY_MS);
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
            payerName: true,
            payerType: true,
            targetType: true,
            gatewayStatus: true,
            verificationStatus: true,
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

export async function getPlatformPaymentLedger(
  period = getCurrentPeriod(),
  options?: {
    skip?: number;
    take?: number;
    q?: string;
  },
) {
  const { start, end } = monthlyRange(period);
  const where = {
    deletedAt: null,
    ...(options?.q
      ? {
          OR: [
            { name: { contains: options.q, mode: "insensitive" as const } },
            { slug: { contains: options.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [totalOrganizations, orgs] = await Promise.all([
    prisma.organization.count({ where }),
    prisma.organization.findMany({
      where,
      orderBy: { name: "asc" },
      skip: options?.skip,
      take: options?.take,
      select: {
        id: true,
        name: true,
        slug: true,
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
        },
        rentCharges: {
          where: {
            period,
            status: { not: "WAIVED" },
          },
          select: {
            amountDue: true,
            balance: true,
          },
        },
        waterBills: {
          where: {
            period,
            status: { not: "CANCELLED" },
          },
          select: {
            total: true,
            payments: {
              select: {
                amount: true,
                gatewayStatus: true,
                verificationStatus: true,
              },
            },
          },
        },
        _count: {
          select: {
            tenants: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    }),
  ]);

  const rows = orgs.map((org) => {
    const rentDue = org.rentCharges.reduce(
      (sum, charge) => sum + toLedgerNumber(charge.amountDue),
      0,
    );
    const rentBalance = org.rentCharges.reduce(
      (sum, charge) => sum + toLedgerNumber(charge.balance),
      0,
    );
    const waterDue = org.waterBills.reduce(
      (sum, bill) => sum + toLedgerNumber(bill.total),
      0,
    );
    const waterPaid = org.waterBills.reduce(
      (sum, bill) =>
        sum +
        bill.payments
          .filter(isRecognizedPayment)
          .reduce((paymentSum, payment) => paymentSum + toLedgerNumber(payment.amount), 0),
      0,
    );
    const paid = org.payments
      .filter(isRecognizedPayment)
      .reduce((sum, payment) => sum + toLedgerNumber(payment.amount), 0);
    const expected = rentDue + waterDue;
    const deficit = Math.max(rentBalance + Math.max(waterDue - waterPaid, 0), 0);

    return {
      orgId: org.id,
      name: org.name,
      slug: org.slug,
      tenantCount: org._count.tenants,
      expected,
      paid,
      deficit,
      paymentCount: org.payments.length,
      lastPaymentAt:
        org.payments
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

export async function queueDuePaymentNotifications(db: LedgerDb = prisma) {
  const now = new Date();

  const [rentCharges, waterBills] = await Promise.all([
    db.rentCharge.findMany({
      where: {
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
