import { Prisma } from "@prisma/client";

export function statusClasses(tone: string) {
  switch (tone) {
    case "settled":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    case "default":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";
    case "overdue":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
    case "due":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200";
    default:
      return "border-border bg-muted/20 text-foreground";
  }
}

export function formatStatus(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function reconciliationClasses(value: string) {
  switch (value) {
    case "RECONCILED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    case "DISPUTED":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
  }
}

export function getTransactionMessage(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const message = value.transactionMessage;
  return typeof message === "string" ? message : "";
}

/** Prefer human checkout method label stored on submission metadata. */
export function getCheckoutMethodLabel(
  method: string,
  callbackRaw: Prisma.JsonValue | null | undefined,
) {
  if (callbackRaw && typeof callbackRaw === "object" && !Array.isArray(callbackRaw)) {
    const label = (callbackRaw as Record<string, unknown>).methodLabel;
    if (typeof label === "string" && label.trim()) return label;
    const checkoutMethod = (callbackRaw as Record<string, unknown>).checkoutMethod;
    if (typeof checkoutMethod === "string" && checkoutMethod.trim()) {
      return formatStatus(checkoutMethod.replace(/-/g, "_"));
    }
  }
  return formatStatus(method);
}

export function formatPeriodLabel(period: string) {
  const [year, month] = period.split("-");
  if (!year || !month) return period;

  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  });
}