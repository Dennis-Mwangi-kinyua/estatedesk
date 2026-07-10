import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";
import {
  isPayableWaterBillStatus,
  tenantVisibleWaterBillWhere,
} from "@/lib/water-bills/status";
import { toLedgerNumber } from "@/lib/ledger-utils";

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
  rentChargeId: string | null;
  waterBillId: string | null;
};

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

/**
 * Build a single period bill (rent + water + other lease charges) for a tenant lease.
 */
export async function getPeriodBillForTenant({
  db,
  orgId,
  tenantId,
  period,
  showPendingWater = false,
}: {
  db: Db;
  orgId: string;
  tenantId: string;
  period: string;
  /** Invoice UI: include water bills awaiting org approval (not payable). */
  showPendingWater?: boolean;
}): Promise<PeriodBill | null> {
  const lease = await db.lease.findFirst({
    where: {
      orgId,
      tenantId,
      status: "ACTIVE",
      deletedAt: null,
    },
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      unitId: true,
      monthlyRent: true,
      dueDay: true,
      unit: {
        select: {
          houseNo: true,
          serviceCharge: true,
          garbageFee: true,
          property: { select: { name: true } },
        },
      },
      rentCharges: {
        where: {
          period,
          status: { not: "WAIVED" },
        },
        select: {
          id: true,
          chargeType: true,
          amountDue: true,
          amountPaid: true,
          balance: true,
          dueDate: true,
          status: true,
        },
      },
    },
  });

  if (!lease) return null;

  const waterBill = await db.waterBill.findFirst({
    where: {
      orgId,
      tenantId,
      unitId: lease.unitId,
      period,
      ...(showPendingWater
        ? { status: { not: "CANCELLED" as const } }
        : tenantVisibleWaterBillWhere()),
    },
    select: {
      id: true,
      total: true,
      amountPaid: true,
      balance: true,
      status: true,
      dueDate: true,
      unitsUsed: true,
      ratePerUnit: true,
      fixedCharge: true,
    },
  });

  const lines: PeriodBillLine[] = [];
  let dueDate = new Date();

  for (const charge of lease.rentCharges) {
    const amountDue = toLedgerNumber(charge.amountDue);
    const amountPaid = toLedgerNumber(charge.amountPaid);
    const balance = Math.max(toLedgerNumber(charge.balance), 0);
    lines.push({
      kind: charge.chargeType === "RENT" ? "RENT" : "OTHER",
      id: charge.id,
      label:
        charge.chargeType === "RENT"
          ? "Rent"
          : charge.chargeType === "SERVICE_CHARGE"
            ? "Service charge"
            : charge.chargeType === "OTHER"
              ? "Garbage fee"
              : charge.chargeType.replaceAll("_", " ").toLowerCase(),
      amountDue,
      amountPaid,
      balance,
    });
    if (charge.dueDate && charge.dueDate < dueDate) {
      // keep earliest open or any
    }
    dueDate = charge.dueDate;
  }

  // If no rent charge yet but lease is active, surface expected rent for the period
  // so tenants still see a combined bill once water exists (payment path will upsert).
  if (!lines.some((l) => l.kind === "RENT")) {
    const monthly = toLedgerNumber(lease.monthlyRent);
    lines.unshift({
      kind: "RENT",
      id: `pending-rent-${period}`,
      label: "Rent",
      amountDue: monthly,
      amountPaid: 0,
      balance: monthly,
    });
  }

  // Unit-level service and garbage fees are recurring monthly charges. Surface
  // them even before their RentCharge rows are materialized by the pay flow.
  if (!lease.rentCharges.some((charge) => charge.chargeType === "SERVICE_CHARGE")) {
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

  if (!lease.rentCharges.some((charge) => charge.chargeType === "OTHER")) {
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

  let rentChargeId: string | null =
    lease.rentCharges.find((c) => c.chargeType === "RENT")?.id ?? null;
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

  const amountDue = lines.reduce((s, l) => s + l.amountDue, 0);
  const amountPaid = lines.reduce((s, l) => s + l.amountPaid, 0);
  const balance = lines.reduce((s, l) => s + l.balance, 0);

  return {
    period,
    leaseId: lease.id,
    unitId: lease.unitId,
    propertyName: lease.unit.property.name,
    unitHouseNo: lease.unit.houseNo,
    dueDate,
    lines,
    amountDue,
    amountPaid,
    balance,
    isPaid: balance <= 0 && amountDue > 0,
    rentChargeId,
    waterBillId,
  };
}
