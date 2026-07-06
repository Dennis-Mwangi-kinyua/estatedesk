import {
  BillStatus,
  ChargeStatus,
  ChargeType,
  GatewayStatus,
  VerificationStatus,
} from "@prisma/client";
import { isPayableWaterBillStatus } from "@/lib/water-bills/status";
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

  const rentAndChargeBills: CombinedBill[] =
    activeLease?.rentCharges.flatMap((charge): CombinedBill[] => {
      const typeLabel = getChargeTypeLabel(charge.chargeType);

      if (!typeLabel) {
        return [];
      }

      const receiptUrl = getLatestReceiptUrlFromPayments(charge.payments);
      const balance = Number(charge.balance ?? 0);
      const amountDue = Number(charge.amountDue ?? 0);
      const isPaid =
        charge.status === "PAID" ||
        charge.status === "WAIVED" ||
        balance <= 0;

      return [
        {
          id: charge.id,
          source: "RENT_CHARGE",
          typeLabel,
          period: charge.period,
          dueDate: charge.dueDate,
          amountDue,
          balance,
          status: charge.status.replaceAll("_", " "),
          rawStatus: charge.status,
          description: charge.description,
          receiptUrl,
          isPaid,
          payNowHref: isPaid
            ? null
            : `/dashboard/tenant/payments/new?source=rent_charge&id=${charge.id}`,
        },
      ];
    }) ?? [];

  const waterBills: CombinedBill[] =
    tenant.waterBills
      ?.filter((bill) => !activeLease || bill.unitId === activeLease.unitId)
      .map((bill) => {
        const receiptUrl = getLatestReceiptUrlFromPayments(bill.payments);
        const amountDue = Number(bill.total ?? 0);
        const isPaid =
          bill.status === "PAID_VERIFIED" ||
          (bill.status === "PAID_PENDING_VERIFICATION" && !!receiptUrl);
        const canPay = isPayableWaterBillStatus(bill.status);

        return {
          id: bill.id,
          source: "WATER_BILL" as const,
          typeLabel: "Water Bill" as const,
          period: bill.period,
          dueDate: bill.dueDate,
          amountDue,
          balance: isPaid ? 0 : canPay ? amountDue : 0,
          status: bill.status.replaceAll("_", " "),
          rawStatus: bill.status,
          description: bill.notes,
          receiptUrl,
          isPaid,
          payNowHref:
            isPaid || !canPay
              ? null
              : `/dashboard/tenant/payments/new?source=water_bill&id=${bill.id}`,
        };
      }) ?? [];

  return [...rentAndChargeBills, ...waterBills].sort(
    (a, b) => b.dueDate.getTime() - a.dueDate.getTime(),
  );
}