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
    maximumFractionDigits: 0,
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
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    case "BLACKLISTED":
      return "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200";
    case "INACTIVE":
      return "border-border bg-muted/30 text-muted-foreground";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
  }
}

export function leaseStatusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
      return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200";
    case "ENDED":
    case "TERMINATED":
      return "border-border bg-muted/30 text-muted-foreground";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
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

export function tenantInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

type LeaseLike = {
  status: string;
  monthlyRent?: unknown;
  unit?: {
    houseNo?: string | null;
    rentAmount?: unknown;
    property?: { name?: string | null } | null;
    building?: { name?: string | null } | null;
  } | null;
};

export function getCurrentLease<T extends LeaseLike>(leases: T[]): T | null {
  return leases.find((lease) => lease.status === "ACTIVE") ?? leases[0] ?? null;
}

export function formatUnitLocation(lease: LeaseLike | null | undefined) {
  if (!lease?.unit) return "No unit assigned";
  return (
    [
      lease.unit.property?.name,
      lease.unit.building?.name,
      lease.unit.houseNo ? `Unit ${lease.unit.houseNo}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "No unit assigned"
  );
}

export function formatTenantRent(lease: LeaseLike | null | undefined) {
  if (!lease) return "—";
  if (lease.monthlyRent != null) return formatCurrency(lease.monthlyRent);
  if (lease.unit?.rentAmount != null) return formatCurrency(lease.unit.rentAmount);
  return "—";
}

export function buildTenantsPageHref(page: number, query = "") {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (query.trim()) params.set("q", query.trim());
  const qs = params.toString();
  return qs ? `/dashboard/caretaker/tenants?${qs}` : "/dashboard/caretaker/tenants";
}
