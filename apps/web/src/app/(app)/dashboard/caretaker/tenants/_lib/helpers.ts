export const TENANTS_LOAD_ERROR_MESSAGE =
  "We couldn't load tenants right now. Please refresh the page or try again in a few minutes.";

export function formatCurrency(value: unknown) {
  const amount =
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
      ? (value as { toNumber: () => number }).toNumber()
      : Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
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

export function contactHref(kind: "phone" | "sms" | "email", value: string | null) {
  if (!value) return null;

  if (kind === "email") {
    return `mailto:${value}`;
  }

  if (kind === "sms") {
    return `sms:${value}`;
  }

  return `tel:${value}`;
}

export function buildTenantsPageHref(page: number) {
  if (page <= 1) {
    return "/dashboard/caretaker/tenants";
  }

  return `/dashboard/caretaker/tenants?page=${page}`;
}