/**
 * Notifications service — in-process library (Phase 1).
 * Future: workers process for email/SMS/WhatsApp/web-push delivery.
 */
export const NOTIFICATIONS_SERVICE = {
  name: "notifications",
  version: "0.1.0",
  status: "in-process" as const,
  owns: [
    "in-app notifications",
    "push subscriptions delivery",
    "email/SMS/WhatsApp dispatch",
  ],
} as const;

export * from "./lib/notify";
export * from "./lib/dispatch";
export * from "./lib/email";
export * from "./lib/account-credentials";
export * from "./lib/account-credentials-message";
export * from "./lib/owner-statement-email";
export * from "./lib/push-action-url";
export * from "./lib/unread-alert";
export * from "./lib/unread-count";
export * from "./lib/unread-count-query";

export function getNotificationsHealth() {
  return {
    service: NOTIFICATIONS_SERVICE.name,
    status: "ok" as const,
    mode: NOTIFICATIONS_SERVICE.status,
  };
}
