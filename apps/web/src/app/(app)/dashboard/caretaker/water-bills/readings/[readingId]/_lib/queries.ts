import { prisma } from "@/lib/prisma";
import {
  getCaretakerAllowedUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import {
  decodePublicId,
  encodePublicId,
  isEncodedPublicId,
} from "@/lib/public-id";
import { READING_DETAIL_LOAD_ERROR_MESSAGE } from "./helpers";

export async function getCaretakerReadingDetailData({
  orgId,
  caretakerUserId,
  membershipScope,
  publicReadingId,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
  publicReadingId: string;
}) {
  const readingId = decodePublicId(publicReadingId, "meter-reading");

  try {
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker reading detail allowed units" },
    );

    const reading = await retryTransientDatabaseOperation(
      () =>
        prisma.meterReading.findUnique({
          where: { id: readingId },
          include: {
            unit: {
              select: {
                houseNo: true,
                building: {
                  select: {
                    name: true,
                  },
                },
                property: {
                  select: {
                    name: true,
                  },
                },
                leases: {
                  where: {
                    status: "ACTIVE",
                  },
                  take: 1,
                  select: {
                    tenant: {
                      select: {
                        fullName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      { label: "caretaker reading detail load" },
    );

    if (!reading) {
      return {
        ok: false as const,
        notFound: true,
        errorMessage: "This meter reading could not be found.",
        redirectTo: null,
      };
    }

    if (!allowedUnitIds.includes(reading.unitId)) {
      return {
        ok: false as const,
        notFound: true,
        errorMessage: "This meter reading could not be found.",
        redirectTo: null,
      };
    }

    const redirectTo = !isEncodedPublicId(publicReadingId)
      ? `/dashboard/caretaker/water-bills/readings/${encodePublicId(
          reading.id,
          "meter-reading",
        )}`
      : null;

    return {
      ok: true as const,
      redirectTo,
      reading,
    };
  } catch {
    return {
      ok: false as const,
      notFound: false,
      errorMessage: READING_DETAIL_LOAD_ERROR_MESSAGE,
      redirectTo: null,
    };
  }
}