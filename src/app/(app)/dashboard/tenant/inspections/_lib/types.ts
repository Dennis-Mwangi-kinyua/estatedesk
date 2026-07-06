import { InspectionStatus, NoticeStatus, Prisma } from "@prisma/client";

export type TenantInspectionsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export const tenantInspectionsArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    moveOutNotices: {
      orderBy: {
        createdAt: "desc",
      },
      include: {
        lease: {
          include: {
            unit: {
              include: {
                property: true,
                building: true,
              },
            },
          },
        },
        inspection: {
          include: {
            inspector: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    },
  },
});

export type TenantInspectionsResult = Prisma.TenantGetPayload<
  typeof tenantInspectionsArgs
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