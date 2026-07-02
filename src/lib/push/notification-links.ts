import type { NotificationType } from "@prisma/client";

type NotificationAudience = "tenant" | "staff" | "default";

const TENANT_ROUTES: Partial<Record<NotificationType, string>> = {
  RENT_DUE_REMINDER: "/dashboard/tenant/payments",
  RENT_OVERDUE_REMINDER: "/dashboard/tenant/payments",
  WATER_BILL_ISSUED: "/dashboard/tenant/water-bills",
  PAYMENT_RECEIVED: "/dashboard/tenant/payments",
  PAYMENT_VERIFIED: "/dashboard/tenant/payments",
  INSPECTION_SCHEDULED: "/dashboard/tenant/inspections",
  MOVE_OUT_CLOSED: "/dashboard/tenant/notices",
  ISSUE_CREATED: "/dashboard/tenant/issues",
  ISSUE_RESOLVED: "/dashboard/tenant/issues",
  GENERAL: "/dashboard/tenant",
};

const STAFF_ROUTES: Partial<Record<NotificationType, string>> = {
  RENT_DUE_REMINDER: "/dashboard/org/payments",
  RENT_OVERDUE_REMINDER: "/dashboard/org/payments",
  WATER_BILL_ISSUED: "/dashboard/org/notifications",
  PAYMENT_RECEIVED: "/dashboard/org/payments",
  PAYMENT_VERIFIED: "/dashboard/org/payments",
  INSPECTION_SCHEDULED: "/dashboard/org/inspections",
  MOVE_OUT_CLOSED: "/dashboard/org/notifications",
  ISSUE_CREATED: "/dashboard/org/issues",
  ISSUE_RESOLVED: "/dashboard/org/issues",
  GENERAL: "/dashboard/org/notifications",
};

export function resolveNotificationAudience(input: {
  userId?: string | null;
  tenantId?: string | null;
}): NotificationAudience {
  if (input.tenantId && !input.userId) {
    return "tenant";
  }

  if (input.userId) {
    return "staff";
  }

  return "default";
}

export function getDefaultNotificationActionUrl(
  type: NotificationType,
  audience: NotificationAudience = "default",
) {
  if (audience === "tenant") {
    return TENANT_ROUTES[type] ?? "/dashboard/tenant";
  }

  if (audience === "staff") {
    return STAFF_ROUTES[type] ?? "/dashboard/org/notifications";
  }

  return "/dashboard";
}

export function resolveNotificationActionUrl(input: {
  type: NotificationType;
  userId?: string | null;
  tenantId?: string | null;
  actionUrl?: string | null;
}) {
  if (input.actionUrl) {
    return input.actionUrl;
  }

  return getDefaultNotificationActionUrl(
    input.type,
    resolveNotificationAudience(input),
  );
}

export function readNotificationActionUrl(providerResponse: unknown) {
  if (!providerResponse || typeof providerResponse !== "object") {
    return null;
  }

  const actionUrl = (providerResponse as { actionUrl?: unknown }).actionUrl;
  return typeof actionUrl === "string" && actionUrl.startsWith("/") ? actionUrl : null;
}