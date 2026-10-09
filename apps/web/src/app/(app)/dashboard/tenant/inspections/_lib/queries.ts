import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import {
  formatDate,
  formatDateTime,
  getUnitLabel,
} from "@/app/(app)/dashboard/tenant/inspections/_lib/helpers";
import {
  HISTORY_PAGE_SIZE,
  tenantInspectionNoticeArgs,
  type PreparedNotice,
  type TenantInspectionNoticeResult,
} from "@/app/(app)/dashboard/tenant/inspections/_lib/types";

function prepareNotice(
  notice: TenantInspectionNoticeResult,
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

export async function getTenantInspectionsData(
  userId: string,
  orgId: string,
  requestedPage = 1,
) {
  const tenant =
    await retryTransientDatabaseOperation(
      () =>
        prisma.tenant.findFirst({
          where: {
            userId,
            orgId,
            deletedAt: null,
          },
          select: { id: true },
        }),
      { label: "tenant-inspections-page" },
    );

  if (!tenant) return null;

  const noticeWhere = { tenantId: tenant.id };
  const totalNotices = await retryTransientDatabaseOperation(
    () => prisma.moveOutNotice.count({ where: noticeWhere }),
    { label: "tenant-inspections-notice-count" },
  );

  if (totalNotices === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalNotices / HISTORY_PAGE_SIZE));
  const currentPage = Math.min(
    totalPages,
    Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1,
  );
  const skip = (currentPage - 1) * HISTORY_PAGE_SIZE;

  const [notices, latestInspection, inspectionGroups] =
    await retryTransientDatabaseOperation(
      () =>
        Promise.all([
          prisma.moveOutNotice.findMany({
            where: noticeWhere,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip,
            take: HISTORY_PAGE_SIZE,
            ...tenantInspectionNoticeArgs,
          }),
          prisma.inspection.findFirst({
            where: { notice: noticeWhere },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: {
              id: true,
              scheduledAt: true,
              completedAt: true,
              status: true,
              notes: true,
              notice: {
                select: {
                  id: true,
                  moveOutDate: true,
                  noticeDate: true,
                  status: true,
                  notes: true,
                  lease: {
                    select: {
                      unit: {
                        select: {
                          houseNo: true,
                          property: { select: { name: true } },
                          building: { select: { name: true } },
                        },
                      },
                    },
                  },
                  tenantId: true,
                },
              },
              inspector: { select: { fullName: true } },
            },
          }),
          prisma.inspection.groupBy({
            by: ["status"],
            where: { notice: noticeWhere },
            _count: { _all: true },
          }),
        ]),
      { label: "tenant-inspections-history" },
    );

  const inspectionCounts = new Map(
    inspectionGroups.map((group) => [group.status, group._count._all]),
  );
  const totals = {
    totalNotices,
    scheduled: inspectionCounts.get("SCHEDULED") ?? 0,
    completed: inspectionCounts.get("COMPLETED") ?? 0,
    cancelled: inspectionCounts.get("CANCELLED") ?? 0,
  };
  const latestInspectionNotice = latestInspection
    ? prepareNotice({ ...latestInspection.notice, inspection: latestInspection })
    : null;

  return {
    preparedNotices: notices.map(prepareNotice),
    latestInspectionNotice,
    totals,
    currentPage,
    totalPages,
    totalNotices,
  };
}
