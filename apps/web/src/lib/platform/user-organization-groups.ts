import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const UNASSIGNED_USERS = "__unassigned__";
export const activeUserMembership = { deactivatedAt: null, org: { deletedAt: null } } satisfies Prisma.MembershipWhereInput;

export function userOrganizationWhere(organization?: string): Prisma.UserWhereInput {
  if (!organization) return {};
  return { memberships: organization === UNASSIGNED_USERS
    ? { none: activeUserMembership }
    : { some: { ...activeUserMembership, orgId: organization } } };
}

/** Paginate organizations first; never group a partially loaded page of users. */
export async function getUserOrganizationGroups(userWhere: Prisma.UserWhereInput, q: string, page: number, pageSize: number, lookahead = false) {
  const search = { contains: q, mode: "insensitive" as const };
  const matchingUser = q ? { AND: [userWhere, { OR: [{ fullName: search }, { email: search }, { username: search }, { phone: search }] }] } : userWhere;
  const where: Prisma.OrganizationWhereInput = {
    deletedAt: null,
    memberships: { some: { deactivatedAt: null, user: userWhere } },
    ...(q ? { OR: [{ name: search }, { slug: search }, { memberships: { some: { deactivatedAt: null, user: matchingUser } } }] } : {}),
  };
  const unassignedWhere = { AND: [userWhere, userOrganizationWhere(UNASSIGNED_USERS)] };
  const [organizationCount, unassignedCount] = await Promise.all([
    prisma.organization.count({ where }),
    prisma.user.count({ where: q && !"no organization".includes(q.toLowerCase()) ? { AND: [unassignedWhere, matchingUser] } : unassignedWhere }),
  ]);
  const offset = (page - 1) * pageSize;
  const hasUnassigned = unassignedCount > 0;
  const includeUnassigned = hasUnassigned && offset === 0;
  const organizations = await prisma.organization.findMany({ where, orderBy: [{ name: "asc" }, { id: "asc" }], skip: Math.max(0, offset - Number(hasUnassigned)), take: pageSize + Number(lookahead) - Number(includeUnassigned), select: { id: true, name: true, slug: true } });
  const groups = await Promise.all(organizations.map(async org => ({ ...org, count: await prisma.user.count({ where: { AND: [userWhere, userOrganizationWhere(org.id)] } }) })));
  if (includeUnassigned) groups.unshift({ id: UNASSIGNED_USERS, name: "No organization", slug: "", count: unassignedCount });
  return { groups, total: organizationCount + Number(hasUnassigned) };
}
