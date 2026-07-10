import {
  BillStatus,
  ChargeStatus,
  ChargeType,
  GatewayStatus,
  VerificationStatus,
} from "@prisma/client";
import {
  isPayableWaterBillStatus,
  isTenantVisibleWaterBillStatus,
} from "@/lib/water-bills/status";
import type { CombinedBill } from "./types";

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function getChargeTypeLabel(type: ChargeType): CombinedBill["typeLabel"] | null {
  switch (type) {
    case "RENT":
      return "Rent";
    case "WATER":
      return "Water Bill";
    case "SERVICE_CHARGE":
      return "Service Charge";
    case "OTHER":
      return "Garbage";
    default:
      return null;
  }
}

export function getChargeStatusClasses(status: ChargeStatus) {
  switch (status) {
    case "PAID":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PARTIAL":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "OVERDUE":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    case "UNPAID":
      return "border border-orange-200 bg-orange-50 text-orange-700";
    case "WAIVED":
      return "border border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border border-neutral-200 bg-neutral-100 text-foreground/80";
  }
}

export function getWaterBillStatusClasses(status: BillStatus) {
  switch (status) {
    case "PAID_VERIFIED":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING_APPROVAL":
      return "border border-sky-200 bg-sky-50 text-sky-700";
    case "PAYMENT_PENDING":
    case "PAID_PENDING_VERIFICATION":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "DISPUTED":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    case "ISSUED":
      return "border border-orange-200 bg-orange-50 text-orange-700";
    case "CANCELLED":
      return "border border-neutral-200 bg-neutral-100 text-foreground/80";
    default:
      return "border border-neutral-200 bg-neutral-100 text-foreground/80";
  }
}

export function getBillStatusBadgeClasses(bill: CombinedBill) {
  if (bill.source === "PERIOD_BILL") {
    if (bill.isPaid || bill.rawStatus === "PAID") {
      return getChargeStatusClasses("PAID");
    }
    if (bill.rawStatus === "PARTIAL" || (bill.amountPaid ?? 0) > 0) {
      return getChargeStatusClasses("PARTIAL");
    }
    return getChargeStatusClasses("UNPAID");
  }

  if (bill.source === "WATER_BILL") {
    return getWaterBillStatusClasses(bill.rawStatus as BillStatus);
  }

  return getChargeStatusClasses(bill.rawStatus as ChargeStatus);
}

function isSuccessfulPayment(status: GatewayStatus) {
  return status === "SUCCESS";
}

function isVerifiedOrNotRequired(status: VerificationStatus) {
  return status === "VERIFIED" || status === "NOT_REQUIRED";
}

function getLatestReceiptUrlFromPayments(
  payments: Array<{
    receipt: { id: string; pdfUrl: string | null } | null;
    gatewayStatus: GatewayStatus;
    verificationStatus: VerificationStatus;
  }>,
) {
  const matchingPayment = payments.find(
    (payment) =>
      isSuccessfulPayment(payment.gatewayStatus) &&
      isVerifiedOrNotRequired(payment.verificationStatus) &&
      payment.receipt,
  );

  if (!matchingPayment?.receipt) {
    return null;
  }

  return `/dashboard/tenant/receipts/${matchingPayment.receipt.id}`;
}

export function buildCombinedBills(
  tenant: NonNullable<import("./types").TenantInvoiceResult>,
): CombinedBill[] {
  const activeLease = tenant.leases?.[0];
  const periods = new Map<
    string,
    {
      dueDate: Date;
      rentLines: CombinedBill[];
      water: CombinedBill | null;
      other: CombinedBill[];
    }
  >();

  function periodBucket(period: string, dueDate: Date) {
    const existing = periods.get(period);
    if (existing) {
      if (dueDate > existing.dueDate) existing.dueDate = dueDate;
      return existing;
    }
    const created = {
      dueDate,
      rentLines: [] as CombinedBill[],
      water: null as CombinedBill | null,
      other: [] as CombinedBill[],
    };
    periods.set(period, created);
    return created;
  }

  for (const charge of activeLease?.rentCharges ?? []) {
    const typeLabel = getChargeTypeLabel(charge.chargeType);
    if (!typeLabel) continue;

    const receiptUrl = getLatestReceiptUrlFromPayments(charge.payments);
    const balance = Number(charge.balance ?? 0);
    const amountDue = Number(charge.amountDue ?? 0);
    const amountPaid = Number(charge.amountPaid ?? 0);
    const isPaid =
      charge.status === "PAID" ||
      charge.status === "WAIVED" ||
      balance <= 0;

    const row: CombinedBill = {
      id: charge.id,
      source: "RENT_CHARGE",
      typeLabel,
      period: charge.period,
      dueDate: charge.dueDate,
      amountDue,
      amountPaid,
      balance,
      status: charge.status.replaceAll("_", " "),
      rawStatus: charge.status,
      description: charge.description,
      receiptUrl,
      isPaid,
      payNowHref: isPaid
        ? null
        : `/dashboard/tenant/payments/new?source=rent_charge&id=${charge.id}`,
    };

    const bucket = periodBucket(charge.period, charge.dueDate);
    if (charge.chargeType === "RENT") {
      bucket.rentLines.push(row);
    } else {
      bucket.other.push(row);
    }
  }

  for (const bill of tenant.waterBills ?? []) {
    if (!isTenantVisibleWaterBillStatus(bill.status)) continue;
    if (activeLease && bill.unitId !== activeLease.unitId) continue;

    const receiptUrl = getLatestReceiptUrlFromPayments(bill.payments);
    const amountDue = Number(bill.total ?? 0);
    const amountPaid = Number(
      (bill as { amountPaid?: unknown }).amountPaid ?? 0,
    );
    const storedBalance = Number(
      (bill as { balance?: unknown }).balance ?? NaN,
    );
    const isFullyPaid =
      bill.status === "PAID_VERIFIED" ||
      (bill.status === "PAID_PENDING_VERIFICATION" && !!receiptUrl && amountPaid >= amountDue);
    const canPay = isPayableWaterBillStatus(bill.status);
    const balance = isFullyPaid
      ? 0
      : canPay
        ? Number.isFinite(storedBalance) && storedBalance >= 0
          ? storedBalance
          : Math.max(amountDue - amountPaid, 0)
        : 0;

    const row: CombinedBill = {
      id: bill.id,
      source: "WATER_BILL",
      typeLabel: "Water Bill",
      period: bill.period,
      dueDate: bill.dueDate,
      amountDue,
      amountPaid,
      balance,
      status: bill.status.replaceAll("_", " "),
      rawStatus: bill.status,
      description: bill.notes,
      receiptUrl,
      isPaid: isFullyPaid || balance <= 0,
      payNowHref:
        isFullyPaid || !canPay || balance <= 0
          ? null
          : `/dashboard/tenant/payments/new?source=water_bill&id=${bill.id}`,
    };

    periodBucket(bill.period, bill.dueDate).water = row;
  }

  const combined: CombinedBill[] = [];

  for (const [period, bucket] of periods) {
    const rent = bucket.rentLines[0] ?? null;
    const water = bucket.water;
    const hasRentOrWater = Boolean(rent || water);

    // Merge rent + water for the period into one bill when either (or both) exist.
    if (hasRentOrWater && (rent || water)) {
      const lines: import("./types").CombinedBillLine[] = [];
      if (rent) {
        lines.push({
          kind: "RENT",
          label: "Rent",
          amountDue: rent.amountDue,
          amountPaid: rent.amountPaid ?? rent.amountDue - rent.balance,
          balance: rent.balance,
        });
      }
      if (water) {
        lines.push({
          kind: "WATER",
          label: "Water",
          amountDue: water.amountDue,
          amountPaid: water.amountPaid ?? water.amountDue - water.balance,
          balance: water.balance,
        });
      }

      const amountDue = lines.reduce((s, l) => s + l.amountDue, 0);
      const amountPaid = lines.reduce((s, l) => s + l.amountPaid, 0);
      const balance = lines.reduce((s, l) => s + l.balance, 0);
      const isPaid = balance <= 0 && amountDue > 0;
      const receiptUrl = rent?.receiptUrl ?? water?.receiptUrl ?? null;

      let status = "UNPAID";
      if (isPaid) status = "PAID";
      else if (amountPaid > 0) status = "PARTIAL";

      const canPay = balance > 0;

      combined.push({
        id: `period-${period}`,
        source: "PERIOD_BILL",
        typeLabel:
          rent && water ? "Rent + Water" : rent ? "Rent" : "Water Bill",
        period,
        dueDate: bucket.dueDate,
        amountDue,
        amountPaid,
        balance,
        status,
        rawStatus: status,
        description: lines.map((l) => l.label).join(" + "),
        receiptUrl,
        isPaid,
        lines,
        payNowHref: canPay
          ? `/dashboard/tenant/payments/new?source=period_bill&id=${period}`
          : null,
      });
    }

    // Other charge types stay as separate line items (service charge, garbage, …)
    for (const row of bucket.other) {
      combined.push(row);
    }
  }

  return combined.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
}