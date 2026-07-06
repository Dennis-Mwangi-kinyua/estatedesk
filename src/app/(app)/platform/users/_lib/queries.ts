import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { getPagination } from "@/lib/db/pagination";
import { buildWhere, parseRole, parseStatus } from "./helpers";

export async function getPlatformUsersPageData(searchParams: {
  page?: string;
  pageSize?: string;
  q?: string;
  role?: string;
  status?: string;
}) {
  const params = searchParams;
  const q = (params.q ?? "").trim();
  const role = parseRole(params.role);
  const status = parseStatus(params.status);
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 24),
  });
  const where = buildWhere({ q, role, status });

  const users = await retryTransientDatabaseOperation(
    () =>
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          username: true,
          status: true,
          platformRole: true,
          canCreatePlatformAdmins: true,
          isRootSuperAdmin: true,
          createdAt: true,
          lastLoginAt: true,
          platformPermissions: {
            orderBy: { permission: "asc" },
            take: 6,
            select: {
              id: true,
              permission: true,
              granted: true,
            },
          },
          memberships: {
            orderBy: { createdAt: "desc" },
            take: 4,
            select: {
              id: true,
              role: true,
              scopeType: true,
              org: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: {
            select: {
              memberships: true,
              platformPermissions: true,
            },
          },
        },
      }),
    { label: "platform-users-findMany", attempts: 3, delayMs: 400 },
  );

  const totalFiltered = await retryTransientDatabaseOperation(
    () => prisma.user.count({ where }),
    { label: "platform-users-count-filtered", attempts: 3, delayMs: 300 },
  );

  const totalUsers = await retryTransientDatabaseOperation(
    () => prisma.user.count({ where: { deletedAt: null } }),
    { label: "platform-users-count-total", attempts: 3, delayMs: 300 },
  );

  const totalAdmins = await retryTransientDatabaseOperation(
    () =>
      prisma.user.count({
        where: {
          deletedAt: null,
          platformRole: { in: ["SUPER_ADMIN", "PLATFORM_ADMIN"] },
        },
      }),
    { label: "platform-users-count-admins", attempts: 3, delayMs: 300 },
  );

  const activeUsers = await retryTransientDatabaseOperation(
    () => prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
    { label: "platform-users-count-active", attempts: 3, delayMs: 300 },
  );

  return {
    users,
    totalFiltered,
    totalUsers,
    totalAdmins,
    activeUsers,
    page,
    pageSize,
    q,
    role,
    status,
  };
}