import { getOnlineSince } from "@/lib/auth/presence";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLES, type StaffRole } from "@/features/staff/constants/role-meta";

export async function getStaffDirectoryData(input: {
  orgId: string;
  skip: number;
  take: number;
  page: number;
  pageSize: number;
}) {
  const { orgId, skip, take, page, pageSize } = input;
  const now = new Date();
  const onlineSince = getOnlineSince(now);

  const membershipWhere = {
    orgId,
    role: {
      in: [...STAFF_ROLES],
    },
    employmentEndedAt: null,
    org: {
      deletedAt: null,
    },
    user: {
      deletedAt: null,
    },
  };

  const [staff, totalStaff, groupedRoles, onlineStaffUsers] =
    await retryTransientDatabaseOperation(
      () =>
        Promise.all([
      prisma.membership.findMany({
        where: membershipWhere,
        orderBy: [{ role: "asc" }, { user: { fullName: "asc" } }],
        skip,
        take,
        select: {
          id: true,
          role: true,
          scopeType: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              status: true,
              lastLoginAt: true,
              sessions: {
                orderBy: {
                  lastSeenAt: "desc",
                },
                take: 1,
                select: {
                  lastSeenAt: true,
                  expiresAt: true,
                },
              },
            },
          },
        },
      }),
      prisma.membership.count({ where: membershipWhere }),
      prisma.membership.groupBy({
        by: ["role"],
        where: membershipWhere,
        orderBy: {
          role: "asc",
        },
        _count: {
          _all: true,
        },
      }),
      prisma.userSession.count({
        where: {
          expiresAt: {
            gt: now,
          },
          lastSeenAt: {
            gte: onlineSince,
          },
          user: {
            status: "ACTIVE",
            deletedAt: null,
            memberships: {
              some: membershipWhere,
            },
          },
        },
      }),
        ]),
      { label: "getStaffDirectoryData" },
    );

  const roleCounts = STAFF_ROLES.reduce<Record<StaffRole, number>>((acc, role) => {
    acc[role] = 0;
    return acc;
  }, {} as Record<StaffRole, number>);

  for (const row of groupedRoles) {
    const role = row.role as StaffRole;
    roleCounts[role] =
      typeof row._count === "object" && row._count !== null
        ? row._count._all ?? 0
        : 0;
  }

  const rows = staff.map((membership) => {
    const role = membership.role as StaffRole;
    const latestSession = membership.user.sessions[0] ?? null;
    const lastSeenAt =
      latestSession?.lastSeenAt ?? membership.user.lastLoginAt;
    const isOnline = Boolean(
      latestSession &&
        latestSession.expiresAt > now &&
        latestSession.lastSeenAt >= onlineSince,
    );

    return {
      ...membership,
      role,
      isOnline,
      lastSeenAt,
    };
  });

  return {
    totalStaff,
    onlineStaffUsers,
    roleCounts,
    rows,
    page,
    pageSize,
    now,
  };
}