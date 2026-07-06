import { InspectionStatus, NoticeStatus } from "@prisma/client";
import type { TenantInspectionsResult } from "@/app/(app)/dashboard/tenant/inspections/_lib/types";

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getInspectionStatusClasses(status: InspectionStatus) {
  switch (status) {
    case "SCHEDULED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
  }
}

export function getNoticeStatusClasses(status: NoticeStatus) {
  switch (status) {
    case "SUBMITTED":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "INSPECTION_SCHEDULED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "INSPECTION_COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CLOSED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "CANCELLED":
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
    default:
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
  }
}

export function clampPage(page: number, totalPages: number) {
  if (Number.isNaN(page) || page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

export function getUnitLabel(
  notice: TenantInspectionsResult["moveOutNotices"][number],
) {
  const unit = notice.lease.unit;
  return `${unit.property.name} • Unit ${unit.houseNo}${
    unit.building?.name ? ` • ${unit.building.name}` : ""
  }`;
}