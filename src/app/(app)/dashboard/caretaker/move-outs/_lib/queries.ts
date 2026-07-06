import {
  getCaretakerAllowedUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { prisma } from "@/lib/prisma";
import { encodePublicId } from "@/lib/public-id";
import { MOVE_OUTS_LOAD_ERROR_MESSAGE } from "./helpers";

export async function getCaretakerMoveOutsData({
  orgId,
  caretakerUserId,
  membershipScope,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
}) {
  try {
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker move-outs allowed units" },
    );

    const notices = await retryTransientDatabaseOperation(
      () =>
        prisma.moveOutNotice.findMany({
          where: {
            lease: {
              orgId,
              unitId: { in: allowedUnitIds },
            },
          },
          orderBy: { moveOutDate: "asc" },
          take: 30,
          select: {
            id: true,
            status: true,
            moveOutDate: true,
            tenant: {
              select: {
                fullName: true,
                phone: true,
              },
            },
            lease: {
              select: {
                unit: {
                  select: {
                    id: true,
                    houseNo: true,
                    property: { select: { name: true } },
                    building: { select: { name: true } },
                  },
                },
              },
            },
            inspection: {
              select: {
                id: true,
                status: true,
                scheduledAt: true,
              },
            },
          },
        }),
      { label: "caretaker move-outs load" },
    );

    return {
      ok: true as const,
      notices: notices.map((notice) => ({
        ...notice,
        inspectionHref: notice.inspection
          ? `/dashboard/caretaker/inspections/${encodePublicId(
              notice.inspection.id,
              "inspection",
            )}`
          : null,
      })),
    };
  } catch {
    return {
      ok: false as const,
      errorMessage: MOVE_OUTS_LOAD_ERROR_MESSAGE,
      notices: [],
    };
  }
}