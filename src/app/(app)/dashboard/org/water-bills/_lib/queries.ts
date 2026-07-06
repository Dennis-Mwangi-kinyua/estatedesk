import { prisma } from "@/lib/prisma";
import type {
  AllowedRole,
  ApprovalQueueItem,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";

const approvalQueueSelect = {
  id: true,
  period: true,
  prevReading: true,
  currentReading: true,
  unitsUsed: true,
  createdAt: true,
  submittedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
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
      property: {
        select: {
          name: true,
          waterRatePerUnit: true,
          waterFixedCharge: true,
        },
      },
    },
  },
} as const;

export async function getOrgWaterBillsPageData(
  orgId: string,
  orgRole: AllowedRole,
) {
  const approvalQueueWhere = {
    status: "SUBMITTED" as const,
    unit: {
      property: {
        orgId,
        deletedAt: null,
      },
    },
  };

  const [org, approvalQueueCount, approvalQueue, rejectedReadingsCount] =
    await Promise.all([
      prisma.organization.findUniqueOrThrow({
        where: { id: orgId },
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      }),
      prisma.meterReading.count({ where: approvalQueueWhere }),
      prisma.meterReading.findMany({
        where: approvalQueueWhere,
        orderBy: { createdAt: "asc" },
        select: approvalQueueSelect,
      }),
      prisma.meterReading.count({
        where: {
          status: "REJECTED",
          unit: {
            property: {
              orgId,
              deletedAt: null,
            },
          },
        },
      }),
    ]);

  return {
    membership: {
      orgId,
      role: orgRole,
      org,
    },
    approvalQueue: approvalQueue as ApprovalQueueItem[],
    approvalQueueCount,
    rejectedReadingsCount,
  };
}