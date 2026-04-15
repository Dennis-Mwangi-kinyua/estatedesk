import { Prisma } from "@prisma/client";

export function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

export function formatCurrency(value: Prisma.Decimal | number | null | undefined) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function formatDate(date: Date | null | undefined) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function getStatusTone(status: string | null | undefined) {
  switch (status) {
    case "ACTIVE":
    case "PAID_VERIFIED":
    case "VERIFIED":
    case "SUCCESS":
    case "RESOLVED":
    case "CLOSED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PENDING":
    case "PAYMENT_PENDING":
    case "PAID_PENDING_VERIFICATION":
    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "OVERDUE":
    case "FAILED":
    case "REJECTED":
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
  }
}