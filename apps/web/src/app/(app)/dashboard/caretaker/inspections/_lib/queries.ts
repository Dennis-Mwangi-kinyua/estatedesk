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
}) {
  try {
    const allocations = await retryTransientDatabaseOperation(
      () =>
        prisma.caretakerAssignment.findMany({
          where: {
            orgId: args.orgId,
            caretakerUserId: args.userId,
            active: true,
          },
          select: {
            propertyId: true,
            buildingId: true,
            unitId: true,
          },
        }),
      { label: "caretaker inspections allocations" },
    );

    const propertyIds = allocations
      .map((item) => item.propertyId)
      .filter((value): value is string => Boolean(value));

    const buildingIds = allocations
      .map((item) => item.buildingId)
      .filter((value): value is string => Boolean(value));

    const unitIds = allocations
      .map((item) => item.unitId)
      .filter((value): value is string => Boolean(value));

    const allocationFilters = buildCaretakerAllocationFilters({
      userId: args.userId,
      propertyIds,
      buildingIds,
      unitIds,
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
                OR: allocationFilters,
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
      inspections,
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