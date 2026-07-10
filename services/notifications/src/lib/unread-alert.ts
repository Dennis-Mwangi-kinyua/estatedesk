import "server-only";

import { NotificationChannel, NotificationStatus, type NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveNotificationActionUrl } from "@/lib/push/notification-links";

export type NotificationAlertAudience = "org_staff" | "caretaker" | "tenant";

export type UnreadNotificationAlert = {
  count: number;
  href: string;
  latest: {
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    actionUrl: string;
  } | null;
};

function notificationsHub(audience: NotificationAlertAudience) {
  switch (audience) {
    case "caretaker":
      return "/dashboard/caretaker/notifications";
    case "tenant":
      return "/dashboard/tenant/notifications";
    default:
      return "/dashboard/org/notifications";
  }
}

function unreadWhere(input: {
  audience: NotificationAlertAudience;
  orgId: string;
  userId?: string;
  tenantId?: string;
}) {
  const base = {
    orgId: input.orgId,
    channel: NotificationChannel.IN_APP,
    status: NotificationStatus.SENT,
    readAt: null,
  };

  if (input.audience === "tenant" && input.tenantId) {
    return { ...base, tenantId: input.tenantId };
  }

  if (input.audience === "caretaker" && input.userId) {
    return { ...base, userId: input.userId };
  }

  return base;
}

export async function getUnreadNotificationAlert(input: {
  audience: NotificationAlertAudience;
  orgId: string;
  userId?: string;
  tenantId?: string;
}): Promise<UnreadNotificationAlert> {
  const where = unreadWhere(input);
  const href = notificationsHub(input.audience);

  const [count, latest] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findFirst({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        userId: true,
        tenantId: true,
        providerResponse: true,
      },
    }),
  ]);

  if (!latest) {
    return { count, href, latest: null };
  }

  const actionUrl = resolveNotificationActionUrl({
    type: latest.type,
    userId: latest.userId,
    tenantId: latest.tenantId,
    actionUrl: readActionUrl(latest.providerResponse),
    audience:
      input.audience === "org_staff"
        ? "org_staff"
        : input.audience === "caretaker"
          ? "caretaker"
          : "tenant",
  });

  return {
    count,
    href,
    latest: {
      id: latest.id,
      title: latest.title,
      message: latest.message,
      type: latest.type,
      actionUrl,
    },
  };
}

function readActionUrl(providerResponse: unknown) {
  if (!providerResponse || typeof providerResponse !== "object") {
    return null;
  }

  const actionUrl = (providerResponse as { actionUrl?: unknown }).actionUrl;
  return typeof actionUrl === "string" ? actionUrl : null;
}