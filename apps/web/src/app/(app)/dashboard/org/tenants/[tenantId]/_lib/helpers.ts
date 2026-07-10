type DecimalLike = {
  toNumber(): number;
};

export function formatStatus(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function getStatusClasses(status: string) {
  const normalized = String(status).toUpperCase();

  switch (normalized) {
    case "ACTIVE":
    case "PAID_VERIFIED":
    case "VERIFIED":
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING":
    case "PARTIAL":
    case "PAYMENT_PENDING":
    case "INSPECTION_SCHEDULED":
    case "SUBMITTED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "BLACKLISTED":
    case "FAILED":
    case "REJECTED":
    case "OVERDUE":
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";
    case "INACTIVE":
    case "EXPIRED":
    case "TERMINATED":
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function toNumberValue(amount: unknown) {
  if (amount == null) return null;

  if (typeof amount === "object" && amount !== null && "toNumber" in amount) {
    return (amount as DecimalLike).toNumber();
  }

  const parsed = Number(amount);
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatCurrency(amount: unknown) {
  const value = toNumberValue(amount);
  if (value == null) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatBoolean(value: boolean | null | undefined) {
  if (value == null) return "—";
  return value ? "Yes" : "No";
}

export function getLeaseUnitLabel(lease: {
  unit: {
    houseNo: string;
    building: { name: string | null } | null;
    property: { name: string } | null;
  };
}) {
  return [lease.unit.property?.name, lease.unit.building?.name, `Unit ${lease.unit.houseNo}`]
    .filter(Boolean)
    .join(" / ");
}

export function getUnitLabel(unit: {
  houseNo: string;
  building: { name: string | null } | null;
  property: { name: string } | null;
}) {
  return [unit.property?.name, unit.building?.name, `Unit ${unit.houseNo}`]
    .filter(Boolean)
    .join(" / ");
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function imageUrl(key: string | null | undefined) {
  if (!key) return "/images/og-vacancy.svg";
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}
