import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_ROLES,
  type ApprovalQueueItem,
  type MoveOutQueueItem,
  type NotificationFilter,
  type NotificationItem,
  type OrgContext,
  type PageData,
  type PaymentItem,
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

  return base;
}

export async function loadNotificationsPageData(
  filter: NotificationFilter,
): Promise<PageData> {
  const membership = await getCurrentOrgContext();

  const approvalQueueWhere = {
    status: "SUBMITTED" as const,
    unit: {
      property: {
        orgId: membership.orgId,
        deletedAt: null,
      },
    },
  };

  const approvalQueueCount = await prisma.meterReading.count({
    where: approvalQueueWhere,
  });

  const approvalQueue = await prisma.meterReading.findMany({
    where: approvalQueueWhere,
    orderBy: { createdAt: "asc" },
    take: 8,
    select: {
      id: true,
      period: true,
      prevReading: true,
      currentReading: true,
      unitsUsed: true,
      createdAt: true,
      submittedBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      photoAsset: {
        select: {
          key: true,
          fileName: true,
        },
      },
      unit: {
        select: {
          id: true,
          houseNo: true,
          property: {
            select: {
              name: true,
              waterRatePerUnit: true,
              waterFixedCharge: true,
            },
          },
        },
      },
    },
  });

  const moveOutQueue = await prisma.moveOutNotice.findMany({
    where: {
      status: {
        in: ["SUBMITTED", "INSPECTION_SCHEDULED", "INSPECTION_COMPLETED"],
      },
      lease: {
        orgId: membership.orgId,
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 8,
    select: {
      id: true,
      noticeDate: true,
      moveOutDate: true,
      status: true,
      notes: true,
      tenant: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          waterBills: {
            where: {
              status: {
                in: ["ISSUED", "PAYMENT_PENDING", "PAID_PENDING_VERIFICATION", "DISPUTED"],
              },
            },
            select: {
              id: true,
              total: true,
              status: true,
            },
          },
        },
      },
      lease: {
        select: {
          id: true,
          rentCharges: {
            where: {
              status: {
                in: ["UNPAID", "PARTIAL", "OVERDUE"],
              },
            },
            select: {
              id: true,
              amountDue: true,
              amountPaid: true,
              balance: true,
              status: true,
            },
          },
          unit: {
            select: {
              houseNo: true,
              property: {
                select: {
                  name: true,
                },
              },
              building: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      inspection: {
        select: {
          id: true,
          scheduledAt: true,
          status: true,
        },
      },
    },
  });

  const notifications = await prisma.notification.findMany({
    where: getNotificationWhereForFilter(filter, membership),
    orderBy: { createdAt: "desc" },
    take: 18,
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      channel: true,
      status: true,
      readAt: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
      tenant: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
        },
      },
    },
  });

  const recentPayments = await prisma.payment.findMany({
    where: {
      orgId: membership.orgId,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      amount: true,
      method: true,
      targetType: true,
      gatewayStatus: true,
      verificationStatus: true,
      reference: true,
      externalReference: true,
      createdAt: true,
      paidAt: true,
      payerTenant: {
        select: {
          fullName: true,
        },
      },
      rentCharge: {
        select: {
          period: true,
        },
      },
      waterBill: {
        select: {
          period: true,
        },
      },
      taxCharge: {
        select: {
          period: true,
          taxType: true,
        },
      },
    },
  });

  return {
    membership,
    approvalQueue: approvalQueue as ApprovalQueueItem[],
    approvalQueueCount,
    moveOutQueue: moveOutQueue as MoveOutQueueItem[],
    notifications: notifications as NotificationItem[],
    recentPayments: recentPayments as PaymentItem[],
    metrics: {
      totalNotifications: notifications.length,
      unreadCount: notifications.filter((item) => !item.readAt).length,
      queuedCount: notifications.filter((item) => item.status === "QUEUED").length,
      sentCount: notifications.filter((item) => item.status === "SENT").length,
      failedCount: notifications.filter((item) => item.status === "FAILED").length,
    },
  };
}