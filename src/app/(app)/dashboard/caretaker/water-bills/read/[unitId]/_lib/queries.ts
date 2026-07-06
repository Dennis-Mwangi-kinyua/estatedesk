import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { CURRENT_PERIOD } from "@/app/(app)/dashboard/caretaker/water-bills/_lib/types";

export const METER_ENTRY_LOAD_ERROR_MESSAGE =
  "We couldn't load this meter entry right now. Please refresh the page or try again in a few minutes.";

export async function getCaretakerMeterEntryData({
  unitId,
  period = CURRENT_PERIOD,
}: {
  unitId: string;
  period?: string;
}) {
  try {
    const [unit, existingReading] = await retryTransientDatabaseOperation(
      () =>
        Promise.all([
          prisma.unit.findUnique({
            where: { id: unitId },
            select: {
              id: true,
              houseNo: true,
              building: { select: { name: true } },
              property: {
                select: {
                  name: true,
                  waterRatePerUnit: true,
                  waterFixedCharge: true,
                },
              },
              leases: {
                where: { status: "ACTIVE" },
                take: 1,
                select: {
                  tenant: { select: { fullName: true } },
                },
              },
            },
          }),
          prisma.meterReading.findUnique({
            where: {
              unitId_period: { unitId, period },
            },
            select: {
              id: true,
              prevReading: true,
              currentReading: true,
              unitsUsed: true,
              status: true,
            },
          }),
        ]),
      { label: "caretaker meter entry page data" },
    );

    return {
      ok: true as const,
      period,
      unit,
      existingReading,
    };
  } catch (error) {
    logServerError("caretaker.meterEntry.load", error);

    return {
      ok: false as const,
      errorMessage: METER_ENTRY_LOAD_ERROR_MESSAGE,
      period,
      unit: null,
      existingReading: null,
    };
  }
}