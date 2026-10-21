import "server-only";
import type { AppSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { personalNotificationScope } from "./recipient-scope";
import { resolveNotificationActionUrl, readNotificationActionUrl } from "@/lib/push/notification-links";

export async function notificationScopeForSession(session: AppSession) {
  if (!session.activeOrgId || !session.activeOrgRole) throw new Error("Organization access is required.");
  const tenant = session.activeOrgRole === "TENANT" ? await prisma.tenant.findFirst({
    where: { orgId: session.activeOrgId, userId: session.userId, deletedAt: null }, select: { id: true },
  }) : null;
  if (session.activeOrgRole === "TENANT" && !tenant) throw new Error("Tenant profile not found.");
  return { orgId: session.activeOrgId, ...personalNotificationScope({ userId: session.userId, tenantId: tenant?.id }) };
}

export async function readPersonalNotification(session: AppSession, id: string) {
  const scope = await notificationScopeForSession(session);
  const notification = await prisma.notification.findFirst({ where: { ...scope, id } });
  if (!notification) throw new Error("Notification not found.");
  // Change only the selected row: similar notifications may represent separate
  // events, even when their text and timestamps are close.
  await prisma.notification.updateMany({
    where: { ...scope, id, readAt: null },
    data: { readAt: new Date() },
  });
  return resolveNotificationActionUrl({
    type: notification.type,
    title: notification.title,
    audience: session.activeOrgRole === "TENANT" ? "tenant" : session.activeOrgRole === "CARETAKER" ? "caretaker" : "org_staff",
    actionUrl: readNotificationActionUrl(notification.providerResponse),
  });
}

export async function unreadPersonalNotification(session: AppSession, id: string) {
  const scope = await notificationScopeForSession(session);
  const notification = await prisma.notification.findFirst({ where: { ...scope, id } });
  if (!notification) throw new Error("Notification not found.");
  await prisma.notification.updateMany({
    where: { ...scope, id },
    data: { readAt: null },
  });
}

export async function readAllPersonalNotifications(session: AppSession) {
  const scope = await notificationScopeForSession(session);
  await prisma.notification.updateMany({ where: { ...scope, readAt: null }, data: { readAt: new Date() } });
}
