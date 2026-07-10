import { prisma } from "@/lib/prisma";
import {
  formatDate,
  formatDateTime,
  getUnitLabel,
} from "@/app/(app)/dashboard/tenant/inspections/_lib/helpers";
import {
  HISTORY_PAGE_SIZE,
  tenantInspectionsArgs,
  type PreparedNotice,
  type TenantInspectionsResult,
} from "@/app/(app)/dashboard/tenant/inspections/_lib/types";

function prepareNotice(
  notice: TenantInspectionsResult["moveOutNotices"][number],
): PreparedNotice {
  return {
    id: notice.id,
    unitLabel: getUnitLabel(notice),
    moveOutDateLabel: formatDate(notice.moveOutDate),
    noticeDateLabel: formatDate(notice.noticeDate),
    noticeStatus: notice.status,
    noticeStatusLabel: notice.status.replaceAll("_", " "),
    inspectionId: notice.inspection?.id ?? null,
    inspectionScheduledAtLabel: formatDateTime(notice.inspection?.scheduledAt),
    inspectionCompletedAtLabel: formatDateTime(notice.inspection?.completedAt),
    inspectionStatus: notice.inspection?.status ?? null,
    inspectionStatusLabel: notice.inspection?.status
      ? notice.inspection.status.replaceAll("_", " ")
      : null,
    inspectorName: notice.inspection?.inspector.fullName ?? null,
    inspectionNotes: notice.inspection?.notes ?? null,
    noticeNotes: notice.notes ?? null,
  };
}

export async function getTenantInspectionsData(userId: string, orgId: string) {
  const tenant: TenantInspectionsResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantInspectionsArgs,
  });

  const notices = tenant?.moveOutNotices ?? [];

  if (!tenant || notices.length === 0) {
    return null;
  }

  const preparedNotices = notices.map(prepareNotice);
  const noticesWithInspections = preparedNotices.filter(
    (notice) => notice.inspectionStatus !== null,
  );

  const totals = notices.reduce(
    (acc, notice) => {
      acc.totalNotices += 1;

      if (notice.inspection?.status === "SCHEDULED") acc.scheduled += 1;
      if (notice.inspection?.status === "COMPLETED") acc.completed += 1;
      if (notice.inspection?.status === "CANCELLED") acc.cancelled += 1;

      return acc;
    },
    {
      totalNotices: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
    },
  );

  return {
    preparedNotices,
    latestInspectionNotice: noticesWithInspections[0] ?? null,
    totals,
    totalPages: Math.max(
      1,
      Math.ceil(preparedNotices.length / HISTORY_PAGE_SIZE),
    ),
  };
}