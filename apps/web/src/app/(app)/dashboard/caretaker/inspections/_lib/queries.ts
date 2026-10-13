import { caretakerCanCompleteInspection } from "@/lib/caretaker/issue-actions";
import { getCaretakerAllowedUnitIds, type MembershipScope } from "@/lib/caretaker/access";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { buildCaretakerAllocationFilters } from "../[inspectionId]/_lib/helpers";
import { INSPECTIONS_LOAD_ERROR_MESSAGE } from "./helpers";

const emptyInspectionStats = {
  total: 0,
  scheduled: 0,
  completed: 0,
  cancelled: 0,
} as const;

export async function getCaretakerInspectionsData(args: {
  orgId: string;
  userId: string;
  membershipScope?: MembershipScope;
}) {
  try {
    const allowedUnitIds = await getCaretakerAllowedUnitIds({ orgId: args.orgId, caretakerUserId: args.userId, membershipScope: args.membershipScope });

    const allocationFilters = buildCaretakerAllocationFilters({
      userId: args.userId,
      propertyIds: [],
      buildingIds: [],
      unitIds: allowedUnitIds,
    });

    const inspections = await retryTransientDatabaseOperation(
      () =>
        prisma.inspection.findMany({
          where: {
            AND: [
              {
                notice: {
                  lease: {
                    orgId: args.orgId,
                    deletedAt: null,
                  },
                },
              },
              {
                OR: [...allocationFilters, { inspectorUserId: args.userId }],
              },
            ],
          },
          orderBy: {
            scheduledAt: "desc",
          },
          include: {
            notice: {
              select: {
                id: true,
                moveOutDate: true,
                tenant: {
                  select: {
                    id: true,
                    fullName: true,
                    phone: true,
                  },
                },
                lease: {
                  select: {
                    id: true,
                    unit: {
                      select: {
                        id: true,
                        houseNo: true,
                        property: {
                          select: {
                            id: true,
                            name: true,
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
            },
            inspector: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        }),
      { label: "caretaker inspections page data" },
    );

    const total = inspections.length;
    const scheduled = inspections.filter(
      (item) => item.status === "SCHEDULED",
    ).length;
    const completed = inspections.filter(
      (item) => item.status === "COMPLETED",
    ).length;
    const cancelled = inspections.filter(
      (item) => item.status === "CANCELLED",
    ).length;

    return {
      ok: true as const,
      inspections: inspections.map(inspection => ({ ...inspection, canComplete: caretakerCanCompleteInspection(inspection, args.userId) })),
      stats: { total, scheduled, completed, cancelled },
    };
  } catch (error) {
    logServerError("caretaker.inspections.load", error);

    return {
      ok: false as const,
      errorMessage: INSPECTIONS_LOAD_ERROR_MESSAGE,
      inspections: [],
      stats: emptyInspectionStats,
    };
  }
}

export type CaretakerInspectionsPageData = Awaited<
  ReturnType<typeof getCaretakerInspectionsData>
>;
