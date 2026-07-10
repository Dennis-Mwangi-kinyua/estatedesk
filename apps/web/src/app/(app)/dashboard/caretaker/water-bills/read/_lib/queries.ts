import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import {
  getCaretakerAllowedUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { encodePublicId } from "@/lib/public-id";
import { CURRENT_PERIOD } from "@/app/(app)/dashboard/caretaker/water-bills/_lib/types";
import { METER_READ_LOAD_ERROR_MESSAGE } from "./helpers";
import type { QuickEntryUnit } from "./types";

const emptyMeterReadData = {
  period: CURRENT_PERIOD,
  pendingUnits: [] as Array<{
    id: string;
    publicId: string;
    houseNo: string;
    propertyName: string;
    buildingName: string | null;
    tenantName: string;
    previousReading: number;
  }>,
  quickEntryUnits: [] as QuickEntryUnit[],
  totalUnits: 0,
  submittedCount: 0,
};

export async function getCaretakerMeterReadData({
  orgId,
  caretakerUserId,
  membershipScope,
  period = CURRENT_PERIOD,
}: {
  orgId: string;
  caretakerUserId: string;
  membershipScope: MembershipScope;
  period?: string;
}) {
  try {
    // Include unit-, building-, and property-scoped assignments (not buildings only)
    const allowedUnitIds = await retryTransientDatabaseOperation(
      () =>
        getCaretakerAllowedUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker meter read allowed units" },
    );

    if (allowedUnitIds.length === 0) {
      return {
        ok: true as const,
        ...emptyMeterReadData,
        period,
      };
    }

    const [units, meterReadings, previousReadings] =
      await retryTransientDatabaseOperation(
        () =>
          Promise.all([
            prisma.unit.findMany({
              where: {
                id: { in: allowedUnitIds },
                isActive: true,
                status: "OCCUPIED",
                leases: { some: { status: "ACTIVE" } },
              },
              orderBy: [{ property: { name: "asc" } }, { houseNo: "asc" }],
              select: {
                id: true,
                houseNo: true,
                building: { select: { name: true } },
                property: { select: { name: true } },
                leases: {
                  where: { status: "ACTIVE" },
                  take: 1,
                  select: {
                    tenant: { select: { fullName: true } },
                  },
                },
              },
            }),
            prisma.meterReading.findMany({
              where: {
                period,
                unitId: { in: allowedUnitIds },
              },
              select: { id: true, unitId: true },
            }),
            prisma.meterReading.findMany({
              where: {
                period: { lt: period },
                unitId: { in: allowedUnitIds },
              },
              orderBy: [{ period: "desc" }, { createdAt: "desc" }],
              select: {
                unitId: true,
                currentReading: true,
              },
            }),
          ]),
        { label: "caretaker meter read page data" },
      );

    const existingReadingUnitIds = new Set(meterReadings.map((r) => r.unitId));
    const previousReadingMap = new Map<string, number>();

    for (const reading of previousReadings) {
      if (!previousReadingMap.has(reading.unitId)) {
        previousReadingMap.set(reading.unitId, reading.currentReading);
      }
    }

    const pendingUnits = units
      .filter((unit) => !existingReadingUnitIds.has(unit.id))
      .map((unit) => ({
        id: unit.id,
        publicId: encodePublicId(unit.id, "unit"),
        houseNo: unit.houseNo,
        propertyName: unit.property.name,
        buildingName: unit.building?.name ?? null,
        tenantName: unit.leases[0]?.tenant.fullName ?? "No tenant assigned",
        previousReading: previousReadingMap.get(unit.id) ?? 0,
      }));

    const quickEntryUnits: QuickEntryUnit[] = pendingUnits.map((unit) => ({
      id: unit.id,
      houseNo: unit.houseNo,
      propertyName: unit.propertyName,
      buildingName: unit.buildingName,
      tenantName: unit.tenantName,
      previousReading: unit.previousReading,
    }));

    return {
      ok: true as const,
      period,
      pendingUnits,
      quickEntryUnits,
      totalUnits: units.length,
      submittedCount: meterReadings.length,
    };
  } catch (error) {
    logServerError("caretaker.meterRead.load", error);

    return {
      ok: false as const,
      errorMessage: METER_READ_LOAD_ERROR_MESSAGE,
      ...emptyMeterReadData,
      period,
    };
  }
}