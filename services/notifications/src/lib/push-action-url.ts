import "server-only";

import type { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  readNotificationActionUrl,
  resolveNotificationActionUrl,
  type NotificationAudience,
} from "@/lib/push/notification-links";

export async function resolvePushActionUrl(notification: {
  orgId: string;
  type: NotificationType;
  userId: string | null;
  tenantId: string | null;
  providerResponse: unknown;
}) {
  const explicitUrl = readNotificationActionUrl(notification.providerResponse);

  let audience: NotificationAudience = "default";

  const tenantRecipient = notification.tenantId && (!notification.userId || await prisma.tenant.findFirst({
    where: { id: notification.tenantId, orgId: notification.orgId, userId: notification.userId, deletedAt: null }, select: { id: true },
  }));
  if (tenantRecipient) {
    audience = "tenant";
  } else if (notification.userId) {
    const membership = await prisma.membership.findFirst({
      where: {
        orgId: notification.orgId,
        userId: notification.userId,
        employmentEndedAt: null,
      },
      select: { role: true },
    });

    audience = membership?.role === "TENANT" ? "tenant" : membership?.role === "CARETAKER" ? "caretaker" : "org_staff";
  }

  return resolveNotificationActionUrl({
    type: notification.type,
    userId: notification.userId,
    tenantId: notification.tenantId,
    audience,
    actionUrl: explicitUrl,
  });
}
