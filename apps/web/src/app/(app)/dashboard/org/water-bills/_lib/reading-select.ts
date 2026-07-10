import type { LeaseStatus, Prisma } from "@prisma/client";

const meterReadingLeaseStatuses: LeaseStatus[] = ["ACTIVE", "PENDING", "EXPIRED"];

export const orgMeterReadingDetailSelect = {
  id: true,
  period: true,
  prevReading: true,
  currentReading: true,
  unitsUsed: true,
  notes: true,
  status: true,
  rejectionReason: true,
  createdAt: true,
  approvedAt: true,
  submittedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  approvedBy: {
    select: {
      fullName: true,
    },
  },
  photoAsset: {
    select: {
      key: true,
      fileName: true,
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
          name: true,
          waterRatePerUnit: true,
          waterFixedCharge: true,
        },
      },
      // Tenant comes from the bill prepared at submission AND/OR unit leases
      waterBills: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          period: true,
          tenant: {
            select: {
              fullName: true,
              phone: true,
              status: true,
              deletedAt: true,
            },
          },
        },
      },
      leases: {
        where: {
          deletedAt: null,
          status: { in: meterReadingLeaseStatuses },
        },
        orderBy: [{ status: "asc" }, { startDate: "desc" }],
        take: 5,
        select: {
          status: true,
          deletedAt: true,
          startDate: true,
          tenant: {
            select: {
              fullName: true,
              phone: true,
              status: true,
              deletedAt: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.MeterReadingSelect;
