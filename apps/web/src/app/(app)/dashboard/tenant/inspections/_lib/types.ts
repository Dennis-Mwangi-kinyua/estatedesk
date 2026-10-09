import { InspectionStatus, NoticeStatus, Prisma } from "@prisma/client";

export type TenantInspectionsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export const tenantInspectionNoticeArgs =
  Prisma.validator<Prisma.MoveOutNoticeDefaultArgs>()({
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
      inspection: {
        select: {
          id: true,
          scheduledAt: true,
          completedAt: true,
          status: true,
          notes: true,
          inspector: { select: { fullName: true } },
        },
      },
    },
  });

export type TenantInspectionNoticeResult = Prisma.MoveOutNoticeGetPayload<
  typeof tenantInspectionNoticeArgs
>;

export type PreparedNotice = {
  id: string;
  unitLabel: string;
  moveOutDateLabel: string;
  noticeDateLabel: string;
  noticeStatus: NoticeStatus;
  noticeStatusLabel: string;
  inspectionId: string | null;
  inspectionScheduledAtLabel: string;
  inspectionCompletedAtLabel: string;
  inspectionStatus: InspectionStatus | null;
  inspectionStatusLabel: string | null;
  inspectorName: string | null;
  inspectionNotes: string | null;
  noticeNotes: string | null;
};

export type InspectionTotals = {
  totalNotices: number;
  scheduled: number;
  completed: number;
  cancelled: number;
};

export const HISTORY_PAGE_SIZE = 10;
