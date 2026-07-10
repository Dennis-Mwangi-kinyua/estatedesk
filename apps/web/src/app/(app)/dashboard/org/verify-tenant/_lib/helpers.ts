import type { TenantVerificationResult } from "./types";

export function normalizeSearch(rawSearch?: string) {
  return rawSearch?.trim().slice(0, 100) ?? "";
}

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
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Current";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function formatStatus(status: string) {
  if (!status) return "Unknown";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function getStatusClasses(status: string) {
  switch (String(status).toUpperCase()) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "BLACKLISTED":
      return "border-red-200 bg-red-50 text-red-700";
    case "INACTIVE":
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getUnitLabel(
  unit: TenantVerificationResult["leases"][number]["unit"],
) {
  if (!unit) return "Unit not recorded";

  return [
    unit.property?.name,
    unit.building?.name,
    unit.houseNo ? `Unit ${unit.houseNo}` : null,
  ]
    .filter(Boolean)
    .join(" / ");
}

export function getPaidCount(result: TenantVerificationResult) {
  return result.payments.filter(
    (payment) =>
      payment.gatewayStatus === "SUCCESS" ||
      payment.verificationStatus === "VERIFIED",
  ).length;
}

export function getTotalPaid(result: TenantVerificationResult) {
  return result.payments.reduce((total, payment) => {
    const paid =
      payment.gatewayStatus === "SUCCESS" ||
      payment.verificationStatus === "VERIFIED";

    return paid ? total + toNumber(payment.amount) : total;
  }, 0);
}

export function tenantHasMovedOut(result: TenantVerificationResult) {
  return (
    result.moveOutNotices.length > 0 ||
    result.leases.every((lease) => lease.status !== "ACTIVE")
  );
}