export type UnitsPageSearchParams = {
  q?: string;
  status?: string;
  activity?: string;
  page?: string;
  property?: string;
  mix?: string;
};

export type UnitsPageProps = {
  searchParams?: Promise<UnitsPageSearchParams>;
};

export type UnitStatusFilter =
  | "ALL"
  | "OCCUPIED"
  | "VACANT"
  | "RESERVED"
  | "UNDER_MAINTENANCE"
  | "INACTIVE";

export type ActivityFilter = "ALL" | "ACTIVE" | "INACTIVE";

export function formatCurrency(value: unknown, currencyCode = "KES") {
  const amount =
    typeof value === "object" && value !== null && "toNumber" in value
      ? (value as { toNumber: () => number }).toNumber()
      : Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatEnumLabel(value: string | null | undefined) {
  if (!value) return "Unknown";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatUnitTypeLabel(
  type: string | null | undefined,
  bedrooms: number | null | undefined,
) {
  if (!type) return "Unknown";

  if (type === "APARTMENT") {
    if (bedrooms && bedrooms > 0) {
      return `${bedrooms} Bedroom Apartment`;
    }

    return "Apartment";
  }

  if (type === "SINGLE_ROOM") {
    return "Single Room";
  }

  return formatEnumLabel(type);
}

export function encodeUnitMixKey(type: string, bedrooms: number | null) {
  if (type === "APARTMENT") {
    return `APARTMENT-${bedrooms ?? 0}`;
  }

  return type;
}

export function decodeUnitMixKey(key: string): {
  type: string;
  bedrooms: number | null;
} {
  if (key.startsWith("APARTMENT-")) {
    const bedrooms = Number.parseInt(key.slice("APARTMENT-".length), 10);
    return {
      type: "APARTMENT",
      bedrooms: Number.isFinite(bedrooms) ? bedrooms : null,
    };
  }

  return { type: key, bedrooms: null };
}

export function formatUnitMixLabel(key: string) {
  const decoded = decodeUnitMixKey(key);
  return formatUnitTypeLabel(decoded.type, decoded.bedrooms);
}

export function normalizeQuery(value?: string) {
  return value?.trim() ?? "";
}

export function parseStatusFilter(value?: string): UnitStatusFilter {
  const allowed: UnitStatusFilter[] = [
    "ALL",
    "OCCUPIED",
    "VACANT",
    "RESERVED",
    "UNDER_MAINTENANCE",
    "INACTIVE",
  ];

  return allowed.includes((value ?? "ALL") as UnitStatusFilter)
    ? ((value ?? "ALL") as UnitStatusFilter)
    : "ALL";
}

export function parseActivityFilter(value?: string): ActivityFilter {
  const allowed: ActivityFilter[] = ["ALL", "ACTIVE", "INACTIVE"];

  return allowed.includes((value ?? "ALL") as ActivityFilter)
    ? ((value ?? "ALL") as ActivityFilter)
    : "ALL";
}

export function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function buildPageHref(params: {
  page?: number;
  q?: string;
  status?: string;
  activity?: string;
  property?: string;
  mix?: string;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.status && params.status !== "ALL") search.set("status", params.status);
  if (params.activity && params.activity !== "ALL") {
    search.set("activity", params.activity);
  }
  if (params.property) search.set("property", params.property);
  if (params.mix) search.set("mix", params.mix);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const qs = search.toString();
  return qs ? `/dashboard/org/units?${qs}` : "/dashboard/org/units";
}

export function statusClasses(status: string | null | undefined) {
  switch (status) {
    case "OCCUPIED":
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200";
    case "VACANT":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
    case "RESERVED":
    case "PENDING":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-200";
    case "UNDER_MAINTENANCE":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200";
    case "INACTIVE":
    case "DISABLED":
      return "border-border bg-muted/30 text-muted-foreground";
    default:
      return "border-border bg-muted/30 text-muted-foreground";
  }
}