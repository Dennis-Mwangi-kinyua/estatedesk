import { getPagination } from "@/lib/db/pagination";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "./types";

const inspectionInclude = {
  inspector: {
    select: {
      id: true,
      fullName: true,
    },
  },
  notice: {
    select: {
      id: true,
      noticeDate: true,
      moveOutDate: true,
      status: true,
      tenant: {
        select: {
          id: true,
          fullName: true,
        },
      },
      lease: {
        select: {
          id: true,
          unit: {
            select: {
              id: true,
              houseNo: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export async function getOrgInspectionsPageData(orgId: string, page = 1) {
  const now = new Date();
  const inspectionWhere = {
    notice: {
      lease: {
        orgId,
        deletedAt: null,
      },
    },
  };

  const { page: currentPage, skip, take } = getPagination({
    page,
    pageSize: PAGE_SIZE,
  });

  const [
    totalInspections,
    scheduledCount,
    completedCount,
    overdueCount,
    inspections,
  ] = await Promise.all([
    prisma.inspection.count({ where: inspectionWhere }),
    prisma.inspection.count({
      where: { ...inspectionWhere, status: "SCHEDULED" },
    }),
    prisma.inspection.count({
      where: { ...inspectionWhere, status: "COMPLETED" },
    }),
    prisma.inspection.count({
      where: {
        ...inspectionWhere,
        status: "SCHEDULED",
        scheduledAt: { lt: now },
      },
    }),
    prisma.inspection.findMany({
      where: inspectionWhere,
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      skip,
      take,
      include: inspectionInclude,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalInspections / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const showingFrom = totalInspections === 0 ? 0 : skip + 1;
  const showingTo = Math.min(skip + inspections.length, totalInspections);

  return {
    inspections,
    totalInspections,
    scheduledCount,
    completedCount,
    overdueCount,
    currentPage: safePage,
    totalPages,
    showingFrom,
    showingTo,
  };
}