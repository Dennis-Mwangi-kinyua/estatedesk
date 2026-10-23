import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { getPagination } from "@/lib/db/pagination";
import { buildWhere, parseRole, parseStatus } from "./helpers";
import { getUserOrganizationGroups, userOrganizationWhere, UNASSIGNED_USERS } from "@/lib/platform/user-organization-groups";
import { getOnlineSince } from "@/lib/auth/presence";

export async function getPlatformUsersPageData(searchParams: {
  page?: string;
  pageSize?: string;
  q?: string;
  role?: string;
  status?: string;
  organization?: string;
  online?: string;
}) {
  const params = searchParams;
  const q = (params.q ?? "").trim();
  const role = parseRole(params.role);
  const status = parseStatus(params.status);
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 24),
  });
  const organization = params.organization?.slice(0, 200) || undefined;
  const online = params.online === "1";
  const now = new Date();
  const presenceWhere = online ? { status: "ACTIVE" as const, sessions: { some: { expiresAt: { gt: now }, lastSeenAt: { gte: getOnlineSince(now) } } } } : {};
  const where = { AND: [buildWhere({ q, role, status }), presenceWhere, userOrganizationWhere(organization)] };
  const directory = organization ? { groups: [], total: 0 } : await getUserOrganizationGroups({ AND: [buildWhere({ q: "", role, status }), presenceWhere] }, q, page, pageSize);
  const organizationName = organization === UNASSIGNED_USERS ? "No organization" : organization ? (await prisma.organization.findFirst({ where: { id: organization, deletedAt: null }, select: { name: true } }))?.name ?? "Organization unavailable" : null;

  const users = organization ? await retryTransientDatabaseOperation(
    () =>
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          slug: true,
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
  ) : [];

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
    organization,
    online,
    organizationName,
    organizationGroups: directory.groups,
    totalGroups: directory.total,
  };
}
