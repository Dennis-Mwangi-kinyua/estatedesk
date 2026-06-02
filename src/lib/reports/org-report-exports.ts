import { buildCsv } from "@/lib/csv";
import { getCurrentPeriod, getOrgLedger } from "@/lib/ledger";
import { prisma } from "@/lib/prisma";

export type OrgReportExportKind =
  | "rent-roll"
  | "arrears-aging"
  | "occupancy"
  | "owner-statement"
  | "water-recovery";

export const ORG_REPORT_EXPORTS: Array<{
  kind: OrgReportExportKind;
  label: string;
  description: string;
}> = [
  {
    kind: "rent-roll",
    label: "Rent roll",
    description: "Tenant, unit, rent, paid, and balance matrix.",
  },
  {
    kind: "arrears-aging",
    label: "Arrears aging",
    description: "Outstanding balances grouped by overdue age.",
  },
  {
    kind: "occupancy",
    label: "Occupancy",
    description: "Property and unit occupancy status export.",
  },
  {
    kind: "owner-statement",
    label: "Owner statement",
    description: "Property-level expected rent, collections, and balances.",
  },
  {
    kind: "water-recovery",
    label: "Water recovery",
    description: "Water bills, tenant payments, and unrecovered balances.",
  },
];

function agingBucket(daysPastDue: number, balance: number) {
  if (balance <= 0) return "Current";
  if (daysPastDue <= 0) return "Not due";
  if (daysPastDue <= 30) return "1-30 days";
  if (daysPastDue <= 60) return "31-60 days";
  if (daysPastDue <= 90) return "61-90 days";
  return "90+ days";
}

export async function buildOrgReportCsv({
  orgId,
  kind,
  period = getCurrentPeriod(),
}: {
  orgId: string;
  kind: OrgReportExportKind;
  period?: string;
}) {
  if (kind === "occupancy") {
    const units = await prisma.unit.findMany({
      where: { property: { orgId, deletedAt: null }, deletedAt: null },
      orderBy: [{ property: { name: "asc" } }, { building: { name: "asc" } }, { houseNo: "asc" }],
      select: {
        houseNo: true,
        type: true,
        status: true,
        rentAmount: true,
        property: { select: { name: true, location: true } },
        building: { select: { name: true } },
        leases: {
          where: { status: "ACTIVE", deletedAt: null },
          take: 1,
          select: { tenant: { select: { fullName: true, phone: true } } },
        },
      },
    });

    return buildCsv(
      ["property", "location", "building", "unit", "type", "status", "rentAmount", "tenant", "phone"],
      units.map((unit) => ({
        property: unit.property.name,
        location: unit.property.location,
        building: unit.building?.name,
        unit: unit.houseNo,
        type: unit.type,
        status: unit.status,
        rentAmount: unit.rentAmount,
        tenant: unit.leases[0]?.tenant.fullName,
        phone: unit.leases[0]?.tenant.phone,
      })),
    );
  }

  if (kind === "water-recovery") {
    const bills = await prisma.waterBill.findMany({
      where: { orgId },
      orderBy: [{ period: "desc" }, { tenant: { fullName: "asc" } }],
      select: {
        period: true,
        total: true,
        unitsUsed: true,
        status: true,
        dueDate: true,
        tenant: { select: { fullName: true, phone: true } },
        unit: { select: { houseNo: true, property: { select: { name: true } } } },
        payments: { select: { amount: true } },
      },
    });

    return buildCsv(
      ["period", "property", "unit", "tenant", "phone", "unitsUsed", "billTotal", "paid", "balance", "status", "dueDate"],
      bills.map((bill) => {
        const paid = bill.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const total = Number(bill.total);
        return {
          period: bill.period,
          property: bill.unit?.property.name,
          unit: bill.unit?.houseNo,
          tenant: bill.tenant.fullName,
          phone: bill.tenant.phone,
          unitsUsed: bill.unitsUsed,
          billTotal: total,
          paid,
          balance: Math.max(total - paid, 0),
          status: bill.status,
          dueDate: bill.dueDate.toISOString().slice(0, 10),
        };
      }),
    );
  }

  const ledger = await getOrgLedger(orgId, period, {
    includeRecentPayments: false,
  });

  if (kind === "arrears-aging") {
    return buildCsv(
      ["period", "tenant", "phone", "property", "unit", "amountDue", "amountPaid", "balance", "daysPastDue", "agingBucket"],
      ledger.rows
        .filter((row) => row.balance > 0)
        .map((row) => ({
          period,
          tenant: row.tenantName,
          phone: row.phone,
          property: row.propertyName,
          unit: row.unitLabel,
          amountDue: row.amountDue,
          amountPaid: row.amountPaid,
          balance: row.balance,
          daysPastDue: row.daysPastDue,
          agingBucket: agingBucket(row.daysPastDue, row.balance),
        })),
    );
  }

  if (kind === "owner-statement") {
    const grouped = new Map<string, { expected: number; paid: number; balance: number; tenants: number }>();

    for (const row of ledger.rows) {
      const key = row.propertyName || "Unassigned";
      const current = grouped.get(key) ?? { expected: 0, paid: 0, balance: 0, tenants: 0 };
      current.expected += row.amountDue;
      current.paid += row.amountPaid;
      current.balance += row.balance;
      current.tenants += 1;
      grouped.set(key, current);
    }

    return buildCsv(
      ["period", "property", "tenants", "expectedRent", "collected", "outstanding", "collectionRate"],
      Array.from(grouped.entries()).map(([property, values]) => ({
        period,
        property,
        tenants: values.tenants,
        expectedRent: values.expected,
        collected: values.paid,
        outstanding: values.balance,
        collectionRate: values.expected ? `${Math.round((values.paid / values.expected) * 100)}%` : "0%",
      })),
    );
  }

  return buildCsv(
    ["period", "tenant", "phone", "email", "property", "unit", "status", "amountDue", "amountPaid", "balance", "lastPaymentAt"],
    ledger.rows.map((row) => ({
      period,
      tenant: row.tenantName,
      phone: row.phone,
      email: row.email,
      property: row.propertyName,
      unit: row.unitLabel,
      status: row.paymentStatus,
      amountDue: row.amountDue,
      amountPaid: row.amountPaid,
      balance: row.balance,
      lastPaymentAt: row.lastPaymentAt?.toISOString().slice(0, 10),
    })),
  );
}
