import {
  getCaretakerAllowedUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import {
  decodePublicId,
  isEncodedPublicId,
} from "@/lib/public-id";
import { ensureTenantSlug } from "@/lib/tenants/slug";
import { TENANT_DETAIL_LOAD_ERROR_MESSAGE } from "./helpers";

const tenantDetailSelect = {
  id: true,
  orgId: true,
  slug: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  type: true,
  nationalId: true,
  notes: true,
  createdAt: true,
  nextOfKin: {
    select: {
      name: true,
      relationship: true,
      phone: true,
      email: true,
    },
  },
} as const;

export async function getCaretakerTenantDetailData({
  orgId,
  caretakerUserId,
  membershipScope,
  publicTenantId,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
  /** URL segment: preferred human slug, or legacy encoded public id. */
  publicTenantId: string;
}) {
  const rawParam = decodeURIComponent(publicTenantId).trim();

  try {
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker tenant detail allowed units" },
    );

    if (allowedUnitIds.length === 0) {
      return {
        ok: false as const,
        notFound: true,
        errorMessage: "This tenant could not be found.",
        redirectTo: null,
      };
    }

    const scopeFilter = {
      orgId,
      deletedAt: null as null,
      leases: {
        some: {
          deletedAt: null as null,
          unitId: { in: allowedUnitIds },
        },
      },
    };

    // 1) Prefer slug match (canonical URL)
    let tenant = await retryTransientDatabaseOperation(
      () =>
        prisma.tenant.findFirst({
          where: {
            ...scopeFilter,
            slug: rawParam,
          },
          select: {
            ...tenantDetailSelect,
            leases: {
              where: {
                deletedAt: null,
                unitId: { in: allowedUnitIds },
              },
              orderBy: [{ status: "asc" }, { createdAt: "desc" }],
              select: {
                id: true,
                status: true,
                startDate: true,
                endDate: true,
                monthlyRent: true,
                deposit: true,
                unit: {
                  select: {
                    id: true,
                    houseNo: true,
                    rentAmount: true,
                    status: true,
                    property: {
                      select: {
                        id: true,
                        name: true,
                        location: true,
                      },
                    },
                    building: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      { label: "caretaker tenant detail by slug" },
    );

    // 2) Legacy encoded public id or raw cuid
    if (!tenant) {
      let decodedId = rawParam;
      try {
        decodedId = decodePublicId(rawParam, "tenant");
      } catch {
        decodedId = rawParam;
      }

      tenant = await retryTransientDatabaseOperation(
        () =>
          prisma.tenant.findFirst({
            where: {
              ...scopeFilter,
              id: decodedId,
            },
            select: {
              ...tenantDetailSelect,
              leases: {
                where: {
                  deletedAt: null,
                  unitId: { in: allowedUnitIds },
                },
                orderBy: [{ status: "asc" }, { createdAt: "desc" }],
                select: {
                  id: true,
                  status: true,
                  startDate: true,
                  endDate: true,
                  monthlyRent: true,
                  deposit: true,
                  unit: {
                    select: {
                      id: true,
                      houseNo: true,
                      rentAmount: true,
                      status: true,
                      property: {
                        select: {
                          id: true,
                          name: true,
                          location: true,
                        },
                      },
                      building: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          }),
        { label: "caretaker tenant detail by id" },
      );
    }

    if (!tenant) {
      return {
        ok: false as const,
        notFound: true,
        errorMessage: "This tenant could not be found.",
        redirectTo: null,
      };
    }

    const slug = await ensureTenantSlug(prisma, tenant);

    // Always land on the slug URL (never show encoded DB id in the address bar)
    const canonicalPath = `/dashboard/caretaker/tenants/${encodeURIComponent(slug)}`;
    const redirectTo =
      rawParam !== slug || isEncodedPublicId(rawParam) ? canonicalPath : null;

    const issues = await retryTransientDatabaseOperation(
      () =>
        prisma.issueTicket.findMany({
          where: {
            orgId,
            unitId: { in: allowedUnitIds },
            OR: [
              {
                unit: {
                  leases: {
                    some: {
                      tenantId: tenant.id,
                      deletedAt: null,
                    },
                  },
                },
              },
              { assignedToUserId: caretakerUserId },
            ],
          },
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            updatedAt: true,
            unit: {
              select: {
                id: true,
                houseNo: true,
                property: { select: { name: true } },
              },
            },
          },
        }),
      { label: "caretaker tenant detail issues" },
    );

    const activeLease =
      tenant.leases.find((lease) => lease.status === "ACTIVE") ??
      tenant.leases[0] ??
      null;

    const openIssues = issues.filter((issue) =>
      ["OPEN", "IN_PROGRESS"].includes(issue.status),
    ).length;

    return {
      ok: true as const,
      redirectTo,
      tenant: { ...tenant, slug },
      activeLease,
      issues,
      openIssues,
    };
  } catch {
    return {
      ok: false as const,
      notFound: false,
      errorMessage: TENANT_DETAIL_LOAD_ERROR_MESSAGE,
      redirectTo: null,
    };
  }
}
