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

  if (explicitUrl) {
    return explicitUrl;
  }

  let audience: NotificationAudience = "default";

  if (notification.tenantId) {
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

    audience = membership?.role === "CARETAKER" ? "caretaker" : "org_staff";
  }

  return resolveNotificationActionUrl({
    type: notification.type,
    userId: notification.userId,
    tenantId: notification.tenantId,
    audience,
  });
}