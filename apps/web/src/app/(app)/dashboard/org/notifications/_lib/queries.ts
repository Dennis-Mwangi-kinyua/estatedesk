import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { collapseNotificationFeedRows } from "@/app/(app)/dashboard/org/notifications/_lib/helpers";
import {
  ALLOWED_ROLES,
  type NotificationFilter,
  type NotificationItem,
  type OrgContext,
  type PageData,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";

export async function getCurrentOrgContext(): Promise<OrgContext> {
  const session = await requireUserSession();

  const whereBase = {
    userId: session.userId,
    role: { in: [...ALLOWED_ROLES] },
    org: {
      deletedAt: null,
      status: "ACTIVE" as const,
    },
    user: {
      deletedAt: null,
    },
  };

  if (session.activeOrgId) {
    const membership = await prisma.membership.findFirst({
      where: {
        ...whereBase,
        orgId: session.activeOrgId,
      },
      select: {
        orgId: true,
        userId: true,
        role: true,
        org: {
          select: {
            id: true,
            name: true,
            slug: true,
            currencyCode: true,
            timezone: true,
          },
        },
      },
    });

    if (membership) return membership as OrgContext;
  }

  const fallbackMembership = await prisma.membership.findFirst({
    where: whereBase,
    orderBy: { createdAt: "desc" },
    select: {
      orgId: true,
      userId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      },
    },
  });

  if (!fallbackMembership) redirect("/dashboard");

  return fallbackMembership as OrgContext;
}

export function normalizeNotificationFilter(value?: string): NotificationFilter {
  const allowed: NotificationFilter[] = [
    "all",
    "unread",
    "payments",
    "issues",
    "moveouts",
    "water",
    "exports",
  ];

  return allowed.includes(value as NotificationFilter)
    ? (value as NotificationFilter)
    : "all";
}

function getNotificationWhereForFilter(
  filter: NotificationFilter,
  membership: OrgContext,
): Prisma.NotificationWhereInput {
  const base = {
    orgId: membership.orgId,
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
      type: { in: ["ISSUE_CREATED", "ISSUE_RESOLVED", "GENERAL"] as const },
      OR: [
        { title: { contains: "issue", mode: "insensitive" as const } },
        { message: { contains: "issue", mode: "insensitive" as const } },
      ],
    };
  }
  if (filter === "moveouts") {
    return {
      ...base,
      OR: [
        { title: { contains: "move-out", mode: "insensitive" as const } },
        { message: { contains: "move-out", mode: "insensitive" as const } },
      ],
    };
  }
  if (filter === "water") {
    return {
      ...base,
      OR: [
        { type: "WATER_BILL_ISSUED" },
        { title: { contains: "water", mode: "insensitive" as const } },
        { message: { contains: "water", mode: "insensitive" as const } },
      ],
    };
  }
  if (filter === "exports") {
    return {
      ...base,
      OR: [
        { title: { contains: "export", mode: "insensitive" as const } },
        { message: { contains: "export", mode: "insensitive" as const } },
      ],
    };
  }

  return base;
}

export async function loadNotificationsPageData(
  filter: NotificationFilter,
): Promise<PageData> {
  const membership = await getCurrentOrgContext();
  const inboxWhere = {
    orgId: membership.orgId,
    userId: membership.userId,
  };
  const [rawNotifications, totalNotifications, unreadCount, filteredCount] = await Promise.all([
    prisma.notification.findMany({
      where: { ...getNotificationWhereForFilter(filter, membership), userId: membership.userId },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        providerResponse: true,
        channel: true,
        status: true,
        readAt: true,
        createdAt: true,
        user: { select: { id: true, fullName: true, email: true, phone: true, status: true } },
        tenant: { select: { id: true, fullName: true, email: true, phone: true, status: true } },
      },
    }),
    prisma.notification.count({ where: { ...inboxWhere, channel: "IN_APP" } }),
    prisma.notification.count({ where: { ...inboxWhere, channel: "IN_APP", readAt: null } }),
    prisma.notification.count({
      where: {
        ...getNotificationWhereForFilter(filter, membership),
        userId: membership.userId,
        channel: "IN_APP",
      },
    }),
  ]);
  const notifications = collapseNotificationFeedRows(rawNotifications, 60);

  return {
    membership,
    notifications: notifications as NotificationItem[],
    metrics: {
      totalNotifications,
      unreadCount,
      filteredCount,
    },
  };
}
