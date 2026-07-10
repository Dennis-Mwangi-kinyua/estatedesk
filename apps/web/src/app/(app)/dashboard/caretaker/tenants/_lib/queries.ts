import { Prisma, TenantStatus } from "@prisma/client";
import { getPagination } from "@/lib/db/pagination";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { getCaretakerAllowedUnitIds } from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { TENANTS_LOAD_ERROR_MESSAGE } from "./helpers";
import { PAGE_SIZE } from "./types";

const emptyTenantPage = {
  tenants: [],
  totalTenants: 0,
  activeTenants: 0,
  inactiveTenants: 0,
  blacklistedTenants: 0,
  currentPage: 1,
  totalPages: 1,
  showingFrom: 0,
  showingTo: 0,
  query: "",
} as const;

export async function getCaretakerTenantsData(args: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: Parameters<typeof getCaretakerAllowedUnitIds>[0]["membershipScope"];
  page?: number;
  query?: string;
}) {
  const query = (args.query ?? "").trim();

  try {
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId: args.orgId,
          caretakerUserId: args.caretakerUserId,
          membershipScope: args.membershipScope,
        }),
      { label: "caretaker tenants allowed units" },
    );

    if (allowedUnitIds.length === 0) {
      return {
        ok: true as const,
        ...emptyTenantPage,
        tenants: [],
        query,
      };
    }

    const textFilter = query
      ? ({ contains: query, mode: "insensitive" } as const)
      : null;

    const tenantWhere: Prisma.TenantWhereInput = {
      orgId: args.orgId,
      deletedAt: null,
      leases: {
        some: {
          deletedAt: null,
          unitId: { in: allowedUnitIds },
        },
      },
      ...(textFilter
        ? {
            OR: [
              { fullName: textFilter },
              { phone: { contains: query } },
              { email: textFilter },
              {
                leases: {
                  some: {
                    deletedAt: null,
                    unitId: { in: allowedUnitIds },
                    OR: [
                      { unit: { houseNo: textFilter } },
                      { unit: { property: { name: textFilter } } },
                      { unit: { building: { name: textFilter } } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const { page, skip, take } = getPagination({
      page: args.page,
      pageSize: PAGE_SIZE,
    });

    const [
      totalTenants,
      activeTenants,
      inactiveTenants,
      blacklistedTenants,
      tenants,
    ] = await retryTransientDatabaseOperation(
      () =>
        Promise.all([
          prisma.tenant.count({ where: tenantWhere }),
          prisma.tenant.count({
            where: { ...tenantWhere, status: TenantStatus.ACTIVE },
          }),
          prisma.tenant.count({
            where: { ...tenantWhere, status: TenantStatus.INACTIVE },
          }),
          prisma.tenant.count({
            where: { ...tenantWhere, status: TenantStatus.BLACKLISTED },
          }),
          prisma.tenant.findMany({
            where: tenantWhere,
            orderBy: [{ fullName: "asc" }],
            skip,
            take,
            include: {
              leases: {
                where: {
                  deletedAt: null,
                  unitId: { in: allowedUnitIds },
                },
                orderBy: [{ status: "asc" }, { createdAt: "desc" }],
                include: {
                  unit: {
                    select: {
                      id: true,
                      houseNo: true,
                      rentAmount: true,
                      status: true,
                      property: {
                        select: { id: true, name: true },
                      },
                      building: {
                        select: { id: true, name: true },
                      },
                    },
                  },
                },
              },
            },
          }),
        ]),
      { label: "caretaker tenants page data" },
    );

    const totalPages = Math.max(1, Math.ceil(totalTenants / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const showingFrom = totalTenants === 0 ? 0 : skip + 1;
    const showingTo = Math.min(skip + tenants.length, totalTenants);

    return {
      ok: true as const,
      tenants,
      totalTenants,
      activeTenants,
      inactiveTenants,
      blacklistedTenants,
      currentPage,
      totalPages,
      showingFrom,
      showingTo,
      query,
    };
  } catch (error) {
    logServerError("caretaker.tenants.load", error);

    return {
      ok: false as const,
      errorMessage: TENANTS_LOAD_ERROR_MESSAGE,
      ...emptyTenantPage,
      tenants: [],
      query,
    };
  }
}
