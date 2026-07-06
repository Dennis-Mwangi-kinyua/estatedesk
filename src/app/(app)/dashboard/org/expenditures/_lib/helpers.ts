import type { ExpenditureStatus } from "@prisma/client";

export function formatMoney(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCategory(category: string) {
  return category.replaceAll("_", " ");
}

export function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function formatScope(scope: string) {
  return scope === "TENANT" ? "Tenant-linked" : "Organization";
}

export function buildExpendituresPageHref(page: number) {
  if (page <= 1) {
    return "/dashboard/org/expenditures";
  }

  return `/dashboard/org/expenditures?page=${page}`;
}

export const fieldClassName =
  "mt-1.5 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20";

export const labelClassName = "block text-sm font-medium text-foreground";

export function getExpenditureStatusClasses(status: ExpenditureStatus) {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    case "RECORDED":
      return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200";
    case "PENDING_APPROVAL":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
    case "APPROVED":
      return "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";
    case "VOIDED":
      return "border-border bg-muted/30 text-muted-foreground";
    default:
      return "border-border bg-muted/20 text-foreground";
  }
}

export function formatExpenditureStatus(status: ExpenditureStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase().replaceAll("_", " ");
}