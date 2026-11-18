import "server-only";
import { isOpeningArrearsCharge } from "@/lib/tenants/opening-arrears";

import type { Prisma, PrismaClient, RentCharge, WaterBill } from "@prisma/client";
import {
  isPayableWaterBillStatus,
  tenantVisibleWaterBillWhere,
} from "@/lib/water-bills/status";
import { applyTenantCredit, applyTenantCreditWithRetry } from "@/lib/payments/tenant-credit";
import { toLedgerNumber } from "@/lib/ledger-utils";
import { sortPeriodBillLinesForDisplay } from "@/lib/billing/allocation-priority";
import { nairobiBillingPeriod } from "./period-dates";

type Db = PrismaClient | Prisma.TransactionClient;

export type PeriodBillLine = {
  kind: "RENT" | "WATER" | "OTHER";
  id: string;
  label: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
};

export type PeriodBill = {
  period: string;
  leaseId: string;
  unitId: string;
  propertyName: string;
  unitHouseNo: string;
  dueDate: Date;
  lines: PeriodBillLine[];
  amountDue: number;
  amountPaid: number;
  balance: number;
  isPaid: boolean;
  waterPendingApproval: boolean;
  rentChargeId: string | null;
  waterBillId: string | null;
};

export function getPeriodInvoiceStatus(bill: PeriodBill) {
  if (bill.isPaid) return "PAID";
  if (bill.waterPendingApproval && bill.balance <= 0) return "PENDING APPROVAL";
  return bill.amountPaid > 0 ? "PARTIAL" : "UNPAID";
}

function waterOutstanding(
  bill: {
    status: string;
    total: Prisma.Decimal | number;
    amountPaid?: Prisma.Decimal | number | null;
    balance?: Prisma.Decimal | number | null;
  },
  options?: { showPendingWater?: boolean },
) {
  if (bill.status === "PAID_VERIFIED" || bill.status === "CANCELLED") {
    return {
      amountDue: toLedgerNumber(bill.total),
      amountPaid: toLedgerNumber(bill.total),
      balance: 0,
    };
  }

  if (bill.status === "PENDING_APPROVAL" && options?.showPendingWater) {
    const total = toLedgerNumber(bill.total);
    return { amountDue: total, amountPaid: 0, balance: 0 };
  }

  if (!isPayableWaterBillStatus(bill.status as never)) {
    const total = toLedgerNumber(bill.total);
    return { amountDue: total, amountPaid: total, balance: 0 };
  }

  const total = toLedgerNumber(bill.total);
  const paid = toLedgerNumber(bill.amountPaid ?? 0);
  const balanceRaw =
    bill.balance != null ? toLedgerNumber(bill.balance) : Math.max(total - paid, 0);

  return {
    amountDue: total,
    amountPaid: paid,
    balance: Math.max(balanceRaw, 0),
  };
}

type PeriodBillOptions = {
  db: Db;
  orgId: string;
  tenantId: string;
  /** Include water bills awaiting approval in invoice displays. */
  showPendingWater?: boolean;
  historicalLeaseId?: string;
};

export async function getPeriodBillForTenant({
  period,
  ...options
}: PeriodBillOptions & { period: string }): Promise<PeriodBill | null> {
  return (await getPeriodBillsForTenant({ ...options, periods: [period] })).get(period) ?? null;
}

export async function getPeriodBillsForTenant({
  db,
  orgId,
  tenantId,
  periods,
  showPendingWater = false,
  historicalLeaseId,
}: PeriodBillOptions & { periods: readonly string[] }): Promise<Map<string, PeriodBill>> {
  if (!periods.length) return new Map();

  if (!historicalLeaseId) {
    if ("$transaction" in db) {
      await applyTenantCreditWithRetry(db as PrismaClient, orgId, tenantId);
    } else {
      await applyTenantCredit(db, orgId, tenantId);
    }
  }
  const lease = await db.lease.findFirst({
    where: {
      orgId,
      tenantId,
      ...(historicalLeaseId
        ? { id: historicalLeaseId, status: { in: ["TERMINATED", "EXPIRED"] } }
        : { status: "ACTIVE" }),
      deletedAt: null,
    },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      unitId: true,
      startDate: true,
      endDate: true,
      monthlyRent: true,
      unit: {
        select: {
          houseNo: true,
          serviceCharge: true,
          garbageFee: true,
          securityFee: true,
          property: { select: { name: true } },
        },
      },
      rentCharges: {
        where: {
          orgId,
          period: { in: [...periods] },
          status: { not: "WAIVED" },
        },
        select: {
          id: true,
          period: true,
          chargeType: true,
          description: true,
          amountDue: true,
          amountPaid: true,
          balance: true,
          dueDate: true,
        },
      },
    },
  });

  if (!lease) return new Map();

  const firstPeriod = historicalLeaseId ? nairobiBillingPeriod(lease.startDate) : null;
  const lastPeriod = historicalLeaseId && lease.endDate ? nairobiBillingPeriod(lease.endDate) : null;
  const waterPeriods = historicalLeaseId
    ? periods.filter(period => firstPeriod && lastPeriod && period >= firstPeriod && period <= lastPeriod)
    : periods;
  const waterBills = waterPeriods.length ? await db.waterBill.findMany({
    where: {
      orgId,
      tenantId,
      unitId: lease.unitId,
      period: { in: [...waterPeriods] },
      ...(showPendingWater
        ? { status: { not: "CANCELLED" as const } }
        : tenantVisibleWaterBillWhere()),
    },
    select: {
      id: true,
      period: true,
      total: true,
      amountPaid: true,
      balance: true,
      status: true,
      dueDate: true,
    },
  }) : [];

  const chargesByPeriod = new Map<string, typeof lease.rentCharges>();
  for (const charge of lease.rentCharges) {
    const charges = chargesByPeriod.get(charge.period);
    if (charges) charges.push(charge);
    else chargesByPeriod.set(charge.period, [charge]);
  }

  const waterByPeriod = new Map(waterBills.map(bill => [bill.period, bill]));
  const bills = new Map<string, PeriodBill>();
  for (const period of new Set(periods)) {
    const rentCharges = chargesByPeriod.get(period) ?? [];
    const waterBill = waterByPeriod.get(period);
    if (historicalLeaseId && !rentCharges.length && !waterBill) continue;
    bills.set(period, buildPeriodBill(period, lease, rentCharges, waterBill, showPendingWater, Boolean(historicalLeaseId)));
  }
  return bills;
}

type PeriodLease = Prisma.LeaseGetPayload<{
  select: {
    id: true;
    unitId: true;
    monthlyRent: true;
    unit: { select: { houseNo: true; serviceCharge: true; garbageFee: true; securityFee: true; property: { select: { name: true } } } };
  };
}>;
type PeriodCharge = Pick<RentCharge, "id" | "chargeType" | "description" | "amountDue" | "amountPaid" | "balance" | "dueDate">;
type PeriodWaterBill = Pick<WaterBill, "id" | "total" | "amountPaid" | "balance" | "status" | "dueDate">;

function buildPeriodBill(
  period: string,
  lease: PeriodLease,
  rentCharges: PeriodCharge[],
  waterBill: PeriodWaterBill | undefined,
  showPendingWater: boolean,
  historical: boolean,
): PeriodBill {
  const lines: PeriodBillLine[] = [];
  const hasOpeningArrears = rentCharges.some(isOpeningArrearsCharge);
  let dueDate = new Date();

  for (const charge of rentCharges) {
    const amountDue = toLedgerNumber(charge.amountDue);
    const amountPaid = toLedgerNumber(charge.amountPaid);
    const balance = Math.max(toLedgerNumber(charge.balance), 0);
    const description = charge.description ?? "";
    let label: string;
    if (charge.chargeType === "RENT") {
      label = "Rent";
    } else if (charge.chargeType === "SERVICE_CHARGE") {
      label = "Service charge";
    } else if (charge.chargeType === "SECURITY") {
      label = "Security fee";
    } else if (charge.chargeType === "OTHER") {
      label =
        /garbage|refuse|waste/i.test(description) || !description.trim()
          ? "Garbage fee"
          : /security/i.test(description)
            ? "Security fee"
            : description;
    } else {
      label = charge.chargeType.replaceAll("_", " ").toLowerCase();
    }
    lines.push({
      kind: charge.chargeType === "RENT" ? "RENT" : "OTHER",
      id: charge.id,
      label,
      amountDue,
      amountPaid,
      balance,
    });
    dueDate = charge.dueDate;
  }

  // If no rent charge yet but lease is active, surface expected rent for the period
  // so tenants still see a combined bill once water exists (payment path will upsert).
  if (!historical && !hasOpeningArrears && !lines.some((l) => l.kind === "RENT")) {
    const monthly = toLedgerNumber(lease.monthlyRent);
    lines.push({
      kind: "RENT",
      id: `pending-rent-${period}`,
      label: "Rent",
      amountDue: monthly,
      amountPaid: 0,
      balance: monthly,
    });
  }

  // Unit-level fees before RentCharge rows are materialized by the pay flow.
  if (!historical && !hasOpeningArrears && !rentCharges.some((charge) => charge.chargeType === "SERVICE_CHARGE")) {
    const serviceCharge = toLedgerNumber(lease.unit.serviceCharge ?? 0);
    if (serviceCharge > 0) {
      lines.push({
        kind: "OTHER",
        id: `pending-service-charge-${period}`,
        label: "Service charge",
        amountDue: serviceCharge,
        amountPaid: 0,
        balance: serviceCharge,
      });
    }
  }

  if (!historical && !hasOpeningArrears && !rentCharges.some((charge) => charge.chargeType === "OTHER")) {
    const garbageFee = toLedgerNumber(lease.unit.garbageFee ?? 0);
    if (garbageFee > 0) {
      lines.push({
        kind: "OTHER",
        id: `pending-garbage-fee-${period}`,
        label: "Garbage fee",
        amountDue: garbageFee,
        amountPaid: 0,
        balance: garbageFee,
      });
    }
  }

  if (
    !historical && !hasOpeningArrears && !rentCharges.some(
      (charge) =>
        charge.chargeType === "SECURITY" ||
        /security/i.test(charge.description ?? ""),
    )
  ) {
    const securityFee = toLedgerNumber(lease.unit.securityFee ?? 0);
    if (securityFee > 0) {
      lines.push({
        kind: "OTHER",
        id: `pending-security-fee-${period}`,
        label: "Security fee",
        amountDue: securityFee,
        amountPaid: 0,
        balance: securityFee,
      });
    }
  }

  let rentChargeId: string | null =
    rentCharges.find((c) => c.chargeType === "RENT")?.id ?? null;
  let waterBillId: string | null = null;

  if (waterBill) {
    const w = waterOutstanding(waterBill, { showPendingWater });
    waterBillId = waterBill.id;
    lines.push({
      kind: "WATER",
      id: waterBill.id,
      label: "Water",
      amountDue: w.amountDue,
      amountPaid: w.amountPaid,
      balance: w.balance,
    });
    if (waterBill.dueDate) dueDate = waterBill.dueDate;
  }

  // Prefer real rent charge id only
  if (rentChargeId?.startsWith("pending-rent-")) {
    rentChargeId = null;
  }

  const orderedLines = sortPeriodBillLinesForDisplay(lines);
  const amountDue = orderedLines.reduce((s, l) => s + l.amountDue, 0);
  const amountPaid = orderedLines.reduce((s, l) => s + l.amountPaid, 0);
  const balance = orderedLines.reduce((s, l) => s + l.balance, 0);

  const waterPendingApproval = waterBill?.status === "PENDING_APPROVAL";

  return {
    period,
    leaseId: lease.id,
    unitId: lease.unitId,
    propertyName: lease.unit.property.name,
    unitHouseNo: lease.unit.houseNo,
    dueDate,
    lines: orderedLines,
    amountDue,
    amountPaid,
    balance,
    isPaid: balance <= 0 && amountDue > 0 && !waterPendingApproval,
    waterPendingApproval,
    rentChargeId,
    waterBillId,
  };
}
