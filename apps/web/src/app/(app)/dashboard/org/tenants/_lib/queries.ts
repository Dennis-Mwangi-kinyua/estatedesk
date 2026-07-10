import { getPagination } from "@/lib/db/pagination";
import { prisma } from "@/lib/prisma";
import { buildTenantWhere, normalizeSearch, normalizeStatus } from "./helpers";
import type { TenantsPageProps } from "./types";

export async function loadTenantsPageData(
  orgId: string,
  searchParams?: Awaited<TenantsPageProps["searchParams"]>,
) {
  const params = searchParams ?? {};
  const search = normalizeSearch(params.search);
  const status = normalizeStatus(params.status);
  const created = params.created === "1";
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 20),
  });
  const where = buildTenantWhere({ orgId, search, status });

  const [
    organization,
    tenants,
    totalTenants,
    activeTenants,
    inactiveTenants,
    blacklistedTenants,
    assignedTenants,
  ] = await Promise.all([
    prisma.organization.findFirst({
      where: {
        id: orgId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        currencyCode: true,
      },
    }),
    prisma.tenant.findMany({
      where,
      orderBy: [{ fullName: "asc" }, { createdAt: "desc" }],
      skip,
      take,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        nationalId: true,
        createdAt: true,
        leases: {
          where: {
            deletedAt: null,
            status: "ACTIVE",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            status: true,
            startDate: true,
            dueDay: true,
            monthlyRent: true,
            caretaker: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
              },
            },
            unit: {
              select: {
                id: true,
                houseNo: true,
                type: true,
                bedrooms: true,
                building: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                property: {
                  select: {
                    id: true,
                    name: true,
                    location: true,
                    address: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.tenant.count({ where }),
    prisma.tenant.count({ where: { orgId, deletedAt: null, status: "ACTIVE" } }),
    prisma.tenant.count({ where: { orgId, deletedAt: null, status: "INACTIVE" } }),
    prisma.tenant.count({ where: { orgId, deletedAt: null, status: "BLACKLISTED" } }),
    prisma.tenant.count({
      where: {
        orgId,
        deletedAt: null,
        leases: {
          some: {
            deletedAt: null,
            status: "ACTIVE",
          },
        },
      },
    }),
  ]);

  return {
    organization,
    organizationName: organization?.name ?? "Organisation",
    tenants,
    totalTenants,
    stats: {
      activeTenants,
      inactiveTenants,
      blacklistedTenants,
      assignedTenants,
    },
    currencyCode: organization?.currencyCode ?? "KES",
    search,
    status,
    created,
    page,
    pageSize,
  };
}