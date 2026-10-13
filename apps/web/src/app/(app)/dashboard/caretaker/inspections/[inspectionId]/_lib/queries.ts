import { caretakerCanCompleteInspection } from "@/lib/caretaker/issue-actions";
import { getCaretakerAllowedUnitIds, type MembershipScope } from "@/lib/caretaker/access";
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
  membershipScope?: MembershipScope;
  publicInspectionId: string;
}) {
  const inspectionId = decodePublicId(args.publicInspectionId, "inspection");

  try {
    const allowedUnitIds = await getCaretakerAllowedUnitIds({ orgId: args.orgId, caretakerUserId: args.userId, membershipScope: args.membershipScope });

    const allocationFilters = buildCaretakerAllocationFilters({
      userId: args.userId,
      propertyIds: [],
      buildingIds: [],
      unitIds: allowedUnitIds,
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
              { OR: [...allocationFilters, { inspectorUserId: args.userId }] },
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
      canComplete: caretakerCanCompleteInspection(inspection, args.userId),
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
