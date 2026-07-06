import { prisma } from "@/lib/prisma";
import {
  getNotificationWhereForFilter,
  normalizeNotificationFilter,
} from "./helpers";
import type { TenantNotificationsPageData } from "./types";

export async function getTenantNotificationsData(
  userId: string,
  orgId: string,
  filterValue?: string,
): Promise<TenantNotificationsPageData | null> {
  const tenant = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    select: {
      id: true,
      orgId: true,
      fullName: true,
    },
  });

  if (!tenant) {
    return null;
  }

  const activeFilter = normalizeNotificationFilter(filterValue);
  const tenantContext = { id: tenant.id, orgId: tenant.orgId, userId };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: getNotificationWhereForFilter(activeFilter, tenantContext),
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        channel: true,
        status: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: {
        orgId: tenant.orgId,
        readAt: null,
        OR: [{ tenantId: tenant.id }, { userId }],
      },
    }),
  ]);

  return {
    tenant,
    notifications,
    unreadCount,
    activeFilter,
  };
}