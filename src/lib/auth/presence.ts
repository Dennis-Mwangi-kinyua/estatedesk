import "server-only";

import { prisma } from "@/lib/prisma";

export const ONLINE_WINDOW_MS = 5 * 60 * 1000;
export const SESSION_HEARTBEAT_MS = 60 * 1000;

export function getOnlineSince(now = new Date()) {
  return new Date(now.getTime() - ONLINE_WINDOW_MS);
}

export function getSessionHeartbeatBefore(now = new Date()) {
  return new Date(now.getTime() - SESSION_HEARTBEAT_MS);
}

export function getOnlineSessionWhere(now = new Date()) {
  return {
    expiresAt: {
      gt: now,
    },
    lastSeenAt: {
      gte: getOnlineSince(now),
    },
    user: {
      status: "ACTIVE" as const,
      deletedAt: null,
    },
  };
}

export async function countOnlineUsers(now = new Date()) {
  return prisma.userSession.count({
    where: getOnlineSessionWhere(now),
  });
}

export async function countOnlineUsersForOrg(orgId: string, now = new Date()) {
  return prisma.userSession.count({
    where: {
      ...getOnlineSessionWhere(now),
      user: {
        status: "ACTIVE",
        deletedAt: null,
        OR: [
          {
            memberships: {
              some: {
                orgId,
                org: {
                  deletedAt: null,
                  status: "ACTIVE",
                },
              },
            },
          },
          {
            tenant: {
              orgId,
              deletedAt: null,
            },
          },
        ],
      },
    },
  });
}
