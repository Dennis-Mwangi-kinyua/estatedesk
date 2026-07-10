import {
  getCaretakerAllowedUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { SEARCH_LOAD_ERROR_MESSAGE } from "./helpers";

const emptyResults = {
  hasQuery: false,
  units: [],
  tenants: [],
  issues: [],
  inspections: [],
} as const;

export async function getCaretakerSearchResults({
  orgId,
  caretakerUserId,
  membershipScope,
  q,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
  q: string;
}) {
  const hasQuery = q.length >= 2;

  if (!hasQuery) {
    return {
      ok: true as const,
      ...emptyResults,
    };
  }

  try {
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker search allowed units" },
    );

    if (allowedUnitIds.length === 0) {
      return {
        ok: true as const,
        hasQuery: true,
        units: [],
        tenants: [],
        issues: [],
        inspections: [],
      };
    }

    const textFilter = { contains: q, mode: "insensitive" as const };

    const [units, tenants, issues, inspections] =
      await retryTransientDatabaseOperation(
        () =>
          Promise.all([
            prisma.unit.findMany({
              where: {
                id: { in: allowedUnitIds },
                deletedAt: null,
                houseNo: textFilter,
              },
              take: 10,
              orderBy: { houseNo: "asc" },
              select: {
                id: true,
                houseNo: true,
                status: true,
                updatedAt: true,
                property: { select: { name: true } },
                building: { select: { name: true } },
              },
            }),
            prisma.tenant.findMany({
              where: {
                orgId,
                deletedAt: null,
                OR: [{ fullName: textFilter }, { phone: textFilter }],
                leases: {
                  some: {
                    deletedAt: null,
                    unitId: { in: allowedUnitIds },
                  },
                },
              },
              take: 10,
              orderBy: { fullName: "asc" },
              select: {
                id: true,
                fullName: true,
                phone: true,
                status: true,
                updatedAt: true,
              },
            }),
            prisma.issueTicket.findMany({
              where: {
                orgId,
                title: textFilter,
                OR: [
                  { unitId: { in: allowedUnitIds } },
                  { assignedToUserId: caretakerUserId },
                ],
              },
              take: 10,
              orderBy: { updatedAt: "desc" },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                updatedAt: true,
                unit: {
                  select: {
                    houseNo: true,
                    property: { select: { name: true } },
                  },
                },
              },
            }),
            prisma.inspection.findMany({
              where: {
                notice: {
                  tenant: { fullName: textFilter },
                  lease: {
                    orgId,
                    deletedAt: null,
                    unitId: { in: allowedUnitIds },
                  },
                },
              },
              take: 10,
              orderBy: { scheduledAt: "desc" },
              select: {
                id: true,
                status: true,
                scheduledAt: true,
                updatedAt: true,
                notice: {
                  select: {
                    tenant: { select: { fullName: true } },
                    lease: {
                      select: {
                        unit: {
                          select: {
                            houseNo: true,
                            property: { select: { name: true } },
                          },
                        },
                      },
                    },
                  },
                },
              },
            }),
          ]),
        { label: "caretaker search results" },
      );

    return {
      ok: true as const,
      hasQuery: true,
      units,
      tenants,
      issues,
      inspections,
    };
  } catch {
    return {
      ok: false as const,
      errorMessage: SEARCH_LOAD_ERROR_MESSAGE,
      ...emptyResults,
      hasQuery: true,
    };
  }
}