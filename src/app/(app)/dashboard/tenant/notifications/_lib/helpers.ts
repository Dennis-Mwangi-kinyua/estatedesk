import type { Prisma } from "@prisma/client";
import type { TenantNotificationFilter } from "./types";

export function normalizeNotificationFilter(
  value?: string,
): TenantNotificationFilter {
  const allowed: TenantNotificationFilter[] = [
    "all",
    "unread",
    "payments",
    "issues",
    "moveouts",
    "water",
  ];

  return allowed.includes(value as TenantNotificationFilter)
    ? (value as TenantNotificationFilter)
    : "all";
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

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getStatusMeta(status: string) {
  switch (status) {
    case "SENT":
      return {
        tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "FAILED":
      return {
        tone: "border-red-200 bg-red-50 text-red-700",
      };
    default:
      return {
        tone: "border-amber-200 bg-amber-50 text-amber-700",
      };
  }
}

export function getNotificationWhereForFilter(
  filter: TenantNotificationFilter,
  tenant: { id: string; orgId: string; userId: string },
): Prisma.NotificationWhereInput {
  const base = {
    orgId: tenant.orgId,
    OR: [{ tenantId: tenant.id }, { userId: tenant.userId }],
  };

  if (filter === "unread") return { ...base, readAt: null };
  if (filter === "payments") {
    return {
      ...base,
      type: { in: ["PAYMENT_RECEIVED", "PAYMENT_VERIFIED"] as const },
    };
  }
  if (filter === "issues") {
    return {
      ...base,
      OR: [{ tenantId: tenant.id }, { userId: tenant.userId }],
      AND: [
        {
          OR: [
            { type: { in: ["ISSUE_CREATED", "ISSUE_RESOLVED"] as const } },
            { title: { contains: "issue", mode: "insensitive" as const } },
            { message: { contains: "issue", mode: "insensitive" as const } },
          ],
        },
      ],
    };
  }
  if (filter === "moveouts") {
    return {
      ...base,
      AND: [
        {
          OR: [
            { title: { contains: "move-out", mode: "insensitive" as const } },
            { message: { contains: "move-out", mode: "insensitive" as const } },
          ],
        },
      ],
    };
  }
  if (filter === "water") {
    return {
      ...base,
      AND: [
        {
          OR: [
            { type: "WATER_BILL_ISSUED" },
            { title: { contains: "water", mode: "insensitive" as const } },
            { message: { contains: "water", mode: "insensitive" as const } },
          ],
        },
      ],
    };
  }

  return base;
}