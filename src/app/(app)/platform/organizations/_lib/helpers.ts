import { OrganizationStatus } from "@prisma/client";

const STATUS_VALUES = Object.values(OrganizationStatus);

export function parseOrganizationStatus(value?: string) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return STATUS_VALUES.find((status) => status === normalized) ?? null;
}

export function formatOrganizationDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(value);
}

export const ORGANIZATION_STATUS_VALUES = STATUS_VALUES;