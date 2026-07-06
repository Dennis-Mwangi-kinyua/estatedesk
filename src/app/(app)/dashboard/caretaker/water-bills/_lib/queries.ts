import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import {
  getCaretakerManagedBuildingUnitIds,
  type MembershipScope,
} from "@/lib/caretaker/access";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import {
  formatDate,
  toNumber,
  WATER_BILLS_LOAD_ERROR_MESSAGE,
} from "@/app/(app)/dashboard/caretaker/water-bills/_lib/helpers";
import {
  CURRENT_PERIOD,
  type UnitWithLease,
} from "@/app/(app)/dashboard/caretaker/water-bills/_lib/types";

const emptyWaterBillsData = {
  pendingUnits: [],
  submittedReadings: [],
  approvedReadings: [],
  issuedBills: [],
  totalBilled: 0,
} as const;

export async function getCaretakerWaterBillsData({
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
        getCaretakerManagedBuildingUnitIds({
          orgId,
          caretakerUserId,
          membershipScope,
        }),
      { label: "caretaker water bills allowed units" },
    );

    if (allowedUnitIds.length === 0) {
      return {
        ok: true as const,
        ...emptyWaterBillsData,
      };
    }

    const [units, meterReadings, waterBills] =
      await retryTransientDatabaseOperation(
        () =>
          Promise.all([
            prisma.unit.findMany({
              where: {
                id: {
                  in: allowedUnitIds,
                },
                isActive: true,
                status: "OCCUPIED",
                leases: {
                  some: {
                    status: "ACTIVE",
                  },
                },
              },
              orderBy: [{ property: { name: "asc" } }, { houseNo: "asc" }],
              select: {
                id: true,
                houseNo: true,
                building: {
                  select: {
                    name: true,
                  },
                },
                property: {
                  select: {
                    id: true,
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
                        id: true,
                        fullName: true,
                      },
                    },
                  },
                },
              },
            }),

            prisma.meterReading.findMany({
              where: {
                period: CURRENT_PERIOD,
                unitId: {
                  in: allowedUnitIds,
                },
              },
              orderBy: {
                createdAt: "desc",
              },
              include: {
                unit: {
                  select: {
                    id: true,
                    houseNo: true,
                    building: {
                      select: {
                        name: true,
                      },
                    },
                    property: {
                      select: {
                        id: true,
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
                            id: true,
                            fullName: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            }),

            prisma.waterBill.findMany({
              where: {
                period: CURRENT_PERIOD,
                unitId: {
                  in: allowedUnitIds,
                },
              },
              orderBy: {
                createdAt: "desc",
              },
              include: {
                tenant: {
                  select: {
                    id: true,
                    fullName: true,
                  },
                },
                unit: {
                  select: {
                    id: true,
                    houseNo: true,
                    building: {
                      select: {
                        name: true,
                      },
                    },
                    property: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            }),
          ]),
        { label: "caretaker water bills page data" },
      );

    const billMap = new Map(waterBills.map((bill) => [bill.unitId, bill]));

    const pendingUnits = (units as UnitWithLease[])
      .filter((unit) => {
        const reading = meterReadings.find((r) => r.unitId === unit.id);
        return !reading;
      })
      .map((unit) => ({
        id: unit.id,
        property: unit.property.name,
        building: unit.building?.name ?? "No building",
        houseNo: unit.houseNo,
        tenant: unit.leases[0]?.tenant.fullName ?? "No tenant assigned",
        previousReading: "—",
        currentReading: null,
        unitsUsed: null,
        period: CURRENT_PERIOD,
      }));

    const submittedReadings = meterReadings
      .filter(
        (reading) =>
          reading.status === "SUBMITTED" && !billMap.has(reading.unitId),
      )
      .map((reading) => ({
        id: reading.id,
        property: reading.unit.property.name,
        building: reading.unit.building?.name ?? "No building",
        houseNo: reading.unit.houseNo,
        tenant: reading.unit.leases[0]?.tenant.fullName ?? "No tenant assigned",
        previousReading: reading.prevReading,
        currentReading: reading.currentReading,
        unitsUsed: reading.unitsUsed,
        period: reading.period,
        submittedAt: formatDate(reading.createdAt),
      }));

    const approvedReadings = meterReadings
      .filter(
        (reading) =>
          reading.status === "APPROVED" && !billMap.has(reading.unitId),
      )
      .map((reading) => ({
        id: reading.id,
        property: reading.unit.property.name,
        building: reading.unit.building?.name ?? "No building",
        houseNo: reading.unit.houseNo,
        tenant: reading.unit.leases[0]?.tenant.fullName ?? "No tenant assigned",
        previousReading: reading.prevReading,
        currentReading: reading.currentReading,
        unitsUsed: reading.unitsUsed,
        period: reading.period,
        submittedAt: formatDate(reading.approvedAt),
      }));

    const issuedBills = waterBills.map((bill) => ({
      id: bill.id,
      property: bill.unit.property.name,
      building: bill.unit.building?.name ?? "No building",
      houseNo: bill.unit.houseNo,
      tenant: bill.tenant.fullName,
      unitsUsed: bill.unitsUsed,
      total: bill.total,
      dueDate: formatDate(bill.dueDate),
      period: bill.period,
    }));

    const totalBilled = waterBills.reduce(
      (sum, bill) => sum + toNumber(bill.total),
      0,
    );

    return {
      ok: true as const,
      pendingUnits,
      submittedReadings,
      approvedReadings,
      issuedBills,
      totalBilled,
    };
  } catch (error) {
    logServerError("caretaker.waterBills.load", error);

    return {
      ok: false as const,
      errorMessage: WATER_BILLS_LOAD_ERROR_MESSAGE,
      ...emptyWaterBillsData,
    };
  }
}