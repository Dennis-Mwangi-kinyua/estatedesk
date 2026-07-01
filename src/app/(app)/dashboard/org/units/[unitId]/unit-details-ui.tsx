import type { ReactNode } from "react";

export function formatCurrency(value: unknown, currencyCode = "KES") {
  const amount =
    typeof value === "object" && value !== null && "toNumber" in value
      ? (value as { toNumber: () => number }).toNumber()
      : Number(value ?? 0);
  if (Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function imageUrl(key: string | null | undefined) {
  if (!key) return "/images/og-vacancy.svg";
  if (key.startsWith("/") || key.startsWith("http")) return key;
  return `/${key.replace(/^public\//, "")}`;
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatEnumLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function formatUnitTypeLabel(type: string | null | undefined, bedrooms: number | null | undefined) {
  if (!type) return "Unknown";
  if (type === "APARTMENT") return bedrooms && bedrooms > 0 ? `${bedrooms} Bedroom Apartment` : "Apartment";
  if (type === "SINGLE_ROOM") return "Single Room";
  return formatEnumLabel(type);
}

export function statusClasses(status: string | null | undefined) {
  switch (status) {
    case "OCCUPIED":
    case "ACTIVE": return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "VACANT": return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "RESERVED":
    case "PENDING": return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "UNDER_MAINTENANCE": return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    default: return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

export function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{title}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>{subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}</div>;
}

export function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p><div className="mt-1 text-sm font-medium text-slate-700">{value}</div></div>;
}
