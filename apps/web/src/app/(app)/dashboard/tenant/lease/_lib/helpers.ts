import { ChargeStatus, LeaseStatus, Prisma } from "@prisma/client";

export function formatMoney(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function getDocumentUrl(asset: { key: string } | null | undefined) {
  if (!asset?.key) return null;

  if (asset.key.startsWith("http://") || asset.key.startsWith("https://")) {
    return asset.key;
  }

  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, "")}/${asset.key}`;
  }

  if (bucket && region) {
    return `https://${bucket}.s3.${region}.amazonaws.com/${asset.key}`;
  }

  return null;
}

export function getLeaseStatusClasses(status: LeaseStatus) {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "EXPIRED":
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
    case "TERMINATED":
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
  }
}

export function getChargeStatusClasses(status: ChargeStatus) {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PARTIAL":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "OVERDUE":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "UNPAID":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "WAIVED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
  }
}