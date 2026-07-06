import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import {
  decodePublicId,
  encodePublicId,
  isEncodedPublicId,
} from "@/lib/public-id";
import { buildCaretakerAllocationFilters } from "./helpers";

export const INSPECTION_DETAIL_LOAD_ERROR_MESSAGE =
  "We couldn't load this inspection right now. Please refresh the page or try again in a few minutes.";

export async function getCaretakerInspectionDetail(args: {
  orgId: string;
  userId: string;
  publicInspectionId: string;
}) {
  const inspectionId = decodePublicId(args.publicInspectionId, "inspection");

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
      { label: "caretaker inspection detail allocations" },
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

    const inspection = await retryTransientDatabaseOperation(
      () =>
        prisma.inspection.findFirst({
          where: {
            id: inspectionId,
            AND: [
              {
                notice: {
                  lease: {
                    orgId: args.orgId,
                    deletedAt: null,
                  },
                },
              },
              { OR: allocationFilters },
            ],
          },
          include: {
            inspector: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
              },
            },
            notice: {
              select: {
                id: true,
                noticeDate: true,
                moveOutDate: true,
                status: true,
                tenant: {
                  select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    email: true,
                  },
                },
                lease: {
                  select: {
                    id: true,
                    status: true,
                    startDate: true,
                    endDate: true,
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
          },
        }),
      { label: "caretaker inspection detail load" },
    );

    if (!inspection) {
      return {
        ok: false as const,
        notFound: true,
        errorMessage: "This inspection could not be found.",
        redirectTo: null,
      };
    }

    const redirectTo = !isEncodedPublicId(args.publicInspectionId)
      ? `/dashboard/caretaker/inspections/${encodePublicId(
          inspection.id,
          "inspection",
        )}`
      : null;

    return {
      ok: true as const,
      inspection,
      redirectTo,
    };
  } catch {
    return {
      ok: false as const,
      notFound: false,
      errorMessage: INSPECTION_DETAIL_LOAD_ERROR_MESSAGE,
      redirectTo: null,
    };
  }
}