import { OrgRole } from "@prisma/client";
import { getPagination } from "@/lib/db/pagination";
import { prisma } from "@/lib/prisma";
import { PAGE_SIZE } from "./types";
import type { SessionWithScope } from "./types";

const noticeInclude = {
  tenant: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      status: true,
    },
  },
  lease: {
    select: {
      id: true,
      status: true,
      startDate: true,
      endDate: true,
      monthlyRent: true,
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
          building: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
  inspection: {
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      completedAt: true,
      inspector: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  },
} as const;

export async function getMoveOutsPageData(
  session: SessionWithScope,
  page = 1,
) {
  const orgId = session.activeOrgId!;
  const noticeWhere = {
    lease: {
      orgId,
    },
  };

  const { page: currentPage, skip, take } = getPagination({
    page,
    pageSize: PAGE_SIZE,
  });

  const [
    totalNotices,
    submittedCount,
    scheduledCount,
    completedCount,
    closedCount,
    notices,
    inspectors,
  ] = await Promise.all([
    prisma.moveOutNotice.count({ where: noticeWhere }),
    prisma.moveOutNotice.count({
      where: { ...noticeWhere, status: "SUBMITTED" },
    }),
    prisma.moveOutNotice.count({
      where: { ...noticeWhere, status: "INSPECTION_SCHEDULED" },
    }),
    prisma.moveOutNotice.count({
      where: { ...noticeWhere, status: "INSPECTION_COMPLETED" },
    }),
    prisma.moveOutNotice.count({
      where: { ...noticeWhere, status: "CLOSED" },
    }),
    prisma.moveOutNotice.findMany({
      where: noticeWhere,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
      include: noticeInclude,
    }),
    prisma.membership.findMany({
      where: {
        orgId,
        role: {
          in: [OrgRole.CARETAKER, OrgRole.MANAGER, OrgRole.OFFICE, OrgRole.ADMIN],
        },
        user: {
          deletedAt: null,
        },
      },
      distinct: ["userId"],
      orderBy: {
        createdAt: "asc",
      },
      select: {
        userId: true,
        role: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalNotices / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const showingFrom = totalNotices === 0 ? 0 : skip + 1;
  const showingTo = Math.min(skip + notices.length, totalNotices);

  return {
    session,
    notices,
    inspectors,
    totalNotices,
    submittedCount,
    scheduledCount,
    completedCount,
    closedCount,
    currentPage: safePage,
    totalPages,
    showingFrom,
    showingTo,
  };
}