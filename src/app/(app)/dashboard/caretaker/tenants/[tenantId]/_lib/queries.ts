import {
  getCaretakerAllowedUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import {
  decodePublicId,
  encodePublicId,
  isEncodedPublicId,
} from "@/lib/public-id";
import { TENANT_DETAIL_LOAD_ERROR_MESSAGE } from "./helpers";

export async function getCaretakerTenantDetailData({
  orgId,
  caretakerUserId,
  membershipScope,
  publicTenantId,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
  publicTenantId: string;
}) {
  const tenantId = decodePublicId(publicTenantId, "tenant");

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

    const tenant = await retryTransientDatabaseOperation(
      () =>
        prisma.tenant.findFirst({
          where: {
            id: tenantId,
            orgId,
            deletedAt: null,
            leases: {
              some: {
                deletedAt: null,
                unitId: { in: allowedUnitIds },
              },
            },
          },
          select: {
            id: true,
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
      { label: "caretaker tenant detail load" },
    );

    if (!tenant) {
      return {
        ok: false as const,
        notFound: true,
        errorMessage: "This tenant could not be found.",
        redirectTo: null,
      };
    }

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

    const redirectTo = !isEncodedPublicId(publicTenantId)
      ? `/dashboard/caretaker/tenants/${encodePublicId(tenant.id, "tenant")}`
      : null;

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
      tenant,
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