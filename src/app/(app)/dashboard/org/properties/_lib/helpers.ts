export function formatPropertyType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatMoney(
  value: string | number | null | undefined,
  currencyCode: string,
) {
  if (value === null || value === undefined) return "—";

  const amount =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  if (Number.isNaN(amount)) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(value);
}

export function toPositiveInt(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function buildPageHref(params: {
  page: number;
  q?: string;
  type?: string;
  status?: string;
  created?: string;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.type && params.type !== "all") search.set("type", params.type);
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.created) search.set("created", params.created);
  if (params.page > 1) search.set("page", String(params.page));

  const qs = search.toString();
  return qs ? `/dashboard/org/properties?${qs}` : "/dashboard/org/properties";
}