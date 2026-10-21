import { prisma } from "@/lib/prisma";
import type {
  AllowedRole,
  ApprovalQueueItem,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";

import { orgMeterReadingDetailSelect } from "./reading-select";
import { scopedUnitWhere, type RecordScope } from "@/lib/permissions/record-scope";

/** List cards only need the shared detail shape (subset is fine). */
const approvalQueueSelect = orgMeterReadingDetailSelect;

export async function getOrgWaterBillsPageData(
  orgId: string,
  orgRole: AllowedRole,
  userId: string,
  scope?: RecordScope,
) {
  const orgUnitFilter = {
    unit: scopedUnitWhere(orgId, scope),
  };

  const approvalQueueWhere = {
    status: "SUBMITTED" as const,
    ...orgUnitFilter,
  };

  const [
    org,
    approvalQueueCount,
    approvalQueue,
    rejectedReadingsCount,
    approvedThisPeriodCount,
  ] = await Promise.all([
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
        ...orgUnitFilter,
      },
    }),
    prisma.meterReading.count({
      where: {
        status: "APPROVED",
        ...orgUnitFilter,
      },
    }),
  ]);

  return {
    membership: {
      userId,
      orgId,
      role: orgRole,
      org,
    },
    approvalQueue: approvalQueue as unknown as ApprovalQueueItem[],
    approvalQueueCount,
    rejectedReadingsCount,
    approvedThisPeriodCount,
  };
}
