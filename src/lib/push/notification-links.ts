import type { NotificationType } from "@prisma/client";

export type NotificationAudience = "tenant" | "org_staff" | "caretaker" | "default";

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
  GENERAL: "/tenants/notifications",
};

const ORG_STAFF_ROUTES: Partial<Record<NotificationType, string>> = {
  RENT_DUE_REMINDER: "/dashboard/org/payments",
  RENT_OVERDUE_REMINDER: "/dashboard/org/payments",
  WATER_BILL_ISSUED: "/dashboard/org/notifications",
  PAYMENT_RECEIVED: "/dashboard/org/payments",
  PAYMENT_VERIFIED: "/dashboard/org/payments",
  INSPECTION_SCHEDULED: "/dashboard/org/inspections",
  MOVE_OUT_CLOSED: "/dashboard/org/notifications",
  ISSUE_CREATED: "/dashboard/org/issues",
  ISSUE_RESOLVED: "/dashboard/org/issues",
  ACCOUNTING_REQUEST_SUBMITTED: "/dashboard/org/accounting/requests",
  ACCOUNTING_REQUEST_APPROVED: "/dashboard/org/finance-requests",
  ACCOUNTING_REQUEST_REJECTED: "/dashboard/org/finance-requests",
  GENERAL: "/dashboard/org/notifications",
};

const CARETAKER_ROUTES: Partial<Record<NotificationType, string>> = {
  RENT_DUE_REMINDER: "/dashboard/caretaker/notifications",
  RENT_OVERDUE_REMINDER: "/dashboard/caretaker/notifications",
  WATER_BILL_ISSUED: "/dashboard/caretaker/water-bills",
  PAYMENT_RECEIVED: "/dashboard/caretaker/notifications",
  PAYMENT_VERIFIED: "/dashboard/caretaker/notifications",
  INSPECTION_SCHEDULED: "/dashboard/caretaker/inspections",
  MOVE_OUT_CLOSED: "/dashboard/caretaker/notifications",
  ISSUE_CREATED: "/dashboard/caretaker/today",
  ISSUE_RESOLVED: "/dashboard/caretaker/issues",
  ACCOUNTING_REQUEST_SUBMITTED: "/dashboard/caretaker/notifications",
  ACCOUNTING_REQUEST_APPROVED: "/dashboard/caretaker/finance-requests",
  ACCOUNTING_REQUEST_REJECTED: "/dashboard/caretaker/finance-requests",
  GENERAL: "/dashboard/caretaker/notifications",
};

export function resolveNotificationAudience(input: {
  userId?: string | null;
  tenantId?: string | null;
}): NotificationAudience {
  if (input.tenantId) {
    return "tenant";
  }

  if (input.userId) {
    return "org_staff";
  }

  return "default";
}

export function getDefaultNotificationActionUrl(
  type: NotificationType,
  audience: NotificationAudience = "default",
) {
  if (audience === "tenant") {
    return TENANT_ROUTES[type] ?? "/tenants/notifications";
  }

  if (audience === "caretaker") {
    return CARETAKER_ROUTES[type] ?? "/dashboard/caretaker/notifications";
  }

  if (audience === "org_staff") {
    return ORG_STAFF_ROUTES[type] ?? "/dashboard/org/notifications";
  }

  return "/dashboard";
}

export function resolveNotificationActionUrl(input: {
  type: NotificationType;
  userId?: string | null;
  tenantId?: string | null;
  actionUrl?: string | null;
  audience?: NotificationAudience;
}) {
  if (input.actionUrl) {
    return input.actionUrl;
  }

  const audience = input.audience ?? resolveNotificationAudience(input);

  return getDefaultNotificationActionUrl(input.type, audience);
}

export function readNotificationActionUrl(providerResponse: unknown) {
  if (!providerResponse || typeof providerResponse !== "object") {
    return null;
  }

  const actionUrl = (providerResponse as { actionUrl?: unknown }).actionUrl;
  return typeof actionUrl === "string" && actionUrl.startsWith("/") ? actionUrl : null;
}