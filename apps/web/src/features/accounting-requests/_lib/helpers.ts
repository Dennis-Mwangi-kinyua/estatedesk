import type { AccountingRequestStatus } from "@prisma/client";
import { REQUEST_STATUS_LABELS } from "./constants";

export function formatMoney(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function statusTone(status: AccountingRequestStatus) {
  switch (status) {
    case "SUBMITTED":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "IN_REVIEW":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "PAID":
      return "border-indigo-200 bg-indigo-50 text-indigo-800";
    case "CANCELLED":
    default:
      return "border-border bg-muted/20 text-muted-foreground";
  }
}

export function statusLabel(status: AccountingRequestStatus) {
  return REQUEST_STATUS_LABELS[status];
}

export const fieldClassName =
  "mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20";

export const labelClassName = "block text-sm font-medium text-foreground";

export const buttonPrimaryClassName =
  "inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonSecondaryClassName =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition hover:bg-muted/30";

export const buttonDangerClassName =
  "inline-flex h-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100";