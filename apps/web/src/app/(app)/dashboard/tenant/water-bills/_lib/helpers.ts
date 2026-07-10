import {
  BillStatus,
  GatewayStatus,
  Prisma,
  VerificationStatus,
} from "@prisma/client";
import { getWaterBillOutstandingAmount } from "@/lib/water-bills/status";
import type { WaterBillItem } from "@/app/(app)/dashboard/tenant/water-bills/_lib/types";

export function formatMoney(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return "N/A";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function getBillStatusLabel(status: BillStatus) {
  return status.replaceAll("_", " ");
}

export function getBillStatusClasses(status: BillStatus) {
  switch (status) {
    case "PAID_VERIFIED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING_APPROVAL":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "PAYMENT_PENDING":
    case "PAID_PENDING_VERIFICATION":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "DISPUTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "ISSUED":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "CANCELLED":
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
    default:
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
  }
}

function isSuccessfulPayment(status: GatewayStatus) {
  return status === "SUCCESS";
}

function isVerifiedOrNotRequired(status: VerificationStatus) {
  return status === "VERIFIED" || status === "NOT_REQUIRED";
}

export function getReceiptHref(bill: WaterBillItem) {
  const paymentWithReceipt = bill.payments.find(
    (payment) =>
      payment.receipt &&
      isSuccessfulPayment(payment.gatewayStatus) &&
      isVerifiedOrNotRequired(payment.verificationStatus),
  );

  if (!paymentWithReceipt?.receipt) {
    return null;
  }

  return `/dashboard/tenant/receipts/${paymentWithReceipt.receipt.id}`;
}

export function getOutstandingAmount(bill: WaterBillItem) {
  return getWaterBillOutstandingAmount(bill.status, bill.total);
}

export function getUnitLabel(bill: WaterBillItem) {
  const buildingName = bill.unit.building?.name
    ? ` • ${bill.unit.building.name}`
    : "";

  return `${bill.unit.property.name} • Unit ${bill.unit.houseNo}${buildingName}`;
}

export function clampPage(page: number, totalPages: number) {
  if (Number.isNaN(page) || page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}