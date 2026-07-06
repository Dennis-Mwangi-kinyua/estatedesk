import type { Prisma } from "@prisma/client";

export const PROFILE_LOAD_ERROR_MESSAGE =
  "We couldn't load your profile right now. Please refresh the page or try again in a few minutes.";

export function formatDate(value: Date | null | undefined) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

export function formatMoney(
  amount: Prisma.Decimal | null | undefined,
  currency: string,
) {
  if (!amount) return "Not captured";

  return `${currency} ${amount.toNumber().toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function statusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    case "BLACKLISTED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200";
    case "INACTIVE":
      return "border-border bg-muted/20 text-muted-foreground";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
  }
}