import { OrganizationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { getPagination } from "@/lib/db/pagination";

export function buildOrganizationDirectoryWhere({
  q,
  status,
}: {
  q: string;
  status: OrganizationStatus | null;
}): Prisma.OrganizationWhereInput {
  const where: Prisma.OrganizationWhereInput = { deletedAt: null };

  if (status) {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function getPlatformOrganizationStats() {
  const [
    totalOrganizations,
    activeOrganizations,
    suspendedOrganizations,
    archivedOrganizations,
    subscribedOrganizations,
  ] = await retryTransientDatabaseOperation(
    () =>
      Promise.all([
        prisma.organization.count({ where: { deletedAt: null } }),
        prisma.organization.count({
          where: { deletedAt: null, status: "ACTIVE" },
        }),
        prisma.organization.count({
          where: { deletedAt: null, status: "SUSPENDED" },
        }),
        prisma.organization.count({
          where: { deletedAt: null, status: "DISABLED" },
        }),
        prisma.subscription.count({
          where: {
            org: { deletedAt: null },
            status: { in: ["ACTIVE", "TRIALING"] },
          },
        }),
      ]),
    { label: "platform-organization-stats" },
  );

  return {
    totalOrganizations,
    activeOrganizations,
    suspendedOrganizations,
    archivedOrganizations,
    subscribedOrganizations,
  };
}

export async function getPlatformOrganizationsPageData({
  q,
  status,
  page,
  pageSize,
}: {
  q: string;
  status: OrganizationStatus | null;
  page: number;
  pageSize: number;
}) {
  const { skip, take } = getPagination({ page, pageSize });
  const where = buildOrganizationDirectoryWhere({ q, status });

  const [
    organizations,
    totalFiltered,
    totalOrganizations,
    activeOrganizations,
    suspendedOrganizations,
    archivedOrganizations,
    subscribedOrganizations,
  ] = await retryTransientDatabaseOperation(
    () =>
      Promise.all([
        prisma.organization.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          include: {
              subscription: {
                select: {
                  id: true,
                  plan: true,
                  status: true,
                  currentPeriodEnd: true,
                  trialEndsAt: true,
                },
              },
          },
        }),
        prisma.organization.count({ where }),
        prisma.organization.count({ where: { deletedAt: null } }),
        prisma.organization.count({
          where: { deletedAt: null, status: "ACTIVE" },
        }),
        prisma.organization.count({
          where: { deletedAt: null, status: "SUSPENDED" },
        }),
        prisma.organization.count({
          where: { deletedAt: null, status: "DISABLED" },
        }),
        prisma.subscription.count({
          where: {
            org: { deletedAt: null },
            status: { in: ["ACTIVE", "TRIALING"] },
          },
        }),
      ]),
    { label: "platform-organization-directory" },
  );

  const organizationStats = {
    totalOrganizations,
    activeOrganizations,
    suspendedOrganizations,
    archivedOrganizations,
    subscribedOrganizations,
  };

  const orgIds = organizations.map((org) => org.id);

  const [
    membershipCounts,
    propertyCounts,
    leaseCounts,
    tenantCounts,
    paymentCounts,
  ] = orgIds.length
    ? await retryTransientDatabaseOperation(
        () =>
          Promise.all([
            prisma.membership.groupBy({
              by: ["orgId"],
              where: { orgId: { in: orgIds } },
              _count: { orgId: true },
            }),
            prisma.property.groupBy({
              by: ["orgId"],
              where: { orgId: { in: orgIds }, deletedAt: null },
              _count: { orgId: true },
            }),
            prisma.lease.groupBy({
              by: ["orgId"],
              where: { orgId: { in: orgIds }, deletedAt: null },
              _count: { orgId: true },
            }),
            prisma.tenant.groupBy({
              by: ["orgId"],
              where: { orgId: { in: orgIds }, deletedAt: null },
              _count: { orgId: true },
            }),
            prisma.payment.groupBy({
              by: ["orgId"],
              where: { orgId: { in: orgIds } },
              _count: { orgId: true },
            }),
          ]),
        { label: "platform-organization-directory-counts" },
      )
    : [[], [], [], [], []];

  return {
    organizations,
    totalFiltered,
    organizationStats,
    membershipCounts,
    propertyCounts,
    leaseCounts,
    tenantCounts,
    paymentCounts,
    page,
    pageSize,
    q,
    status,
  };
}