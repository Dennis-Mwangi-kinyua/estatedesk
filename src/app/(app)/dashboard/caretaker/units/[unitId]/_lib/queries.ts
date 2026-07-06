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
import { CURRENT_PERIOD } from "@/app/(app)/dashboard/caretaker/water-bills/_lib/types";
import { UNIT_DETAIL_LOAD_ERROR_MESSAGE } from "./helpers";

export async function getCaretakerUnitDetailData({
  orgId,
  caretakerUserId,
  membershipScope,
  publicUnitId,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
  publicUnitId: string;
}) {
  const unitId = decodePublicId(publicUnitId, "unit");

  try {
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker unit detail allowed units" },
    );

    if (!allowedUnitIds.includes(unitId)) {
      return {
        ok: false as const,
        notFound: true,
        errorMessage: "This unit could not be found.",
        redirectTo: null,
      };
    }

    const unit = await retryTransientDatabaseOperation(
      () =>
        prisma.unit.findFirst({
          where: {
            id: unitId,
            deletedAt: null,
            isActive: true,
            property: { orgId, deletedAt: null },
          },
          select: {
            id: true,
            houseNo: true,
            status: true,
            notes: true,
            rentAmount: true,
            bedrooms: true,
            bathrooms: true,
            property: {
              select: {
                id: true,
                name: true,
                location: true,
                address: true,
              },
            },
            building: {
              select: {
                id: true,
                name: true,
              },
            },
            leases: {
              where: { deletedAt: null },
              orderBy: { startDate: "desc" },
              take: 3,
              select: {
                id: true,
                status: true,
                startDate: true,
                endDate: true,
                monthlyRent: true,
                tenant: {
                  select: {
                    id: true,
                    fullName: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
            issues: {
              orderBy: { updatedAt: "desc" },
              take: 6,
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            meterReadings: {
              orderBy: { createdAt: "desc" },
              take: 3,
              select: {
                id: true,
                period: true,
                currentReading: true,
                unitsUsed: true,
                status: true,
                createdAt: true,
              },
            },
            waterBills: {
              orderBy: { createdAt: "desc" },
              take: 3,
              select: {
                id: true,
                period: true,
                total: true,
                status: true,
                dueDate: true,
              },
            },
          },
        }),
      { label: "caretaker unit detail load" },
    );

    if (!unit) {
      return {
        ok: false as const,
        notFound: true,
        errorMessage: "This unit could not be found.",
        redirectTo: null,
      };
    }

    const redirectTo = !isEncodedPublicId(publicUnitId)
      ? `/dashboard/caretaker/units/${encodePublicId(unit.id, "unit")}`
      : null;

    const activeLease =
      unit.leases.find((lease) => lease.status === "ACTIVE") ?? null;
    const currentPeriodReading =
      unit.meterReadings.find((reading) => reading.period === CURRENT_PERIOD) ??
      null;
    const openIssues = unit.issues.filter((issue) =>
      ["OPEN", "IN_PROGRESS"].includes(issue.status),
    ).length;

    return {
      ok: true as const,
      redirectTo,
      unit,
      activeLease,
      currentPeriodReading,
      openIssues,
      period: CURRENT_PERIOD,
    };
  } catch {
    return {
      ok: false as const,
      notFound: false,
      errorMessage: UNIT_DETAIL_LOAD_ERROR_MESSAGE,
      redirectTo: null,
    };
  }
}