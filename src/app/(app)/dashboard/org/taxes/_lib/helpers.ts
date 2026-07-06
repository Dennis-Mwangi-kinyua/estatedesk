export function toNumber(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

export function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
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

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

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

export function formatPercent(value: unknown) {
  return `${toNumber(value).toFixed(2)}%`;
}

export function getStatusClasses(status: string | null | undefined) {
  switch (status) {
    case "PAID":
    case "ACTIVE":
    case "SUCCESS":
    case "ACKNOWLEDGED":
      return "border-green-200 bg-green-50 text-green-700";
    case "PAYMENT_PENDING":
    case "READY":
    case "SUBMITTED":
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "FAILED":
    case "REJECTED":
    case "ERROR":
    case "OVERDUE":
      return "border-red-200 bg-red-50 text-red-700";
    case "DRAFT":
    case "MANUAL_REVIEW":
    case "DISABLED":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-muted bg-background text-foreground";
  }
}