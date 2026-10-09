import { loadMoveOutBalances } from "@/lib/move-outs/balances";
import { financialStatus } from "@/lib/move-outs/financial-status";
import { getPagination } from "@/lib/db/pagination";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
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
      orgId: true,
      tenantId: true,
      unitId: true,
      status: true,
      startDate: true,
      endDate: true,
      monthlyRent: true,
      deposit: true,
      unit: {
        select: {
          id: true,
          status: true,
          propertyId: true,
          buildingId: true,
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
  ] = await retryTransientDatabaseOperation(() => Promise.all([
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
        employmentEndedAt: null,
        deactivatedAt: null,
        role: { not: "TENANT" },
        user: {
          deletedAt: null,
          status: "ACTIVE",
        },
      },
      distinct: ["userId", "scopeType", "scopeId"],
      orderBy: {
        createdAt: "asc",
      },
      select: {
        userId: true,
        role: true,
        scopeType: true,
        scopeId: true,
        user: {
          select: {
            fullName: true,
          },
        },
      },
    }),
  ]), { label: "organization move-outs page load" });

  const financials = new Map(await Promise.all(notices.map(async notice => {
    const balance = await retryTransientDatabaseOperation(
      () => loadMoveOutBalances(prisma, notice.lease),
      { label: "organization move-outs financial balance" },
    );
    const closeout = notice.closeout && typeof notice.closeout === "object" && !Array.isArray(notice.closeout) ? notice.closeout : {};
    return [notice.id, { currentAmountOwed: balance.totalCents / 100, financialStatus: notice.status === "CLOSED" ? financialStatus(balance.totalCents, closeout.refundStatus === "PENDING") : "PRELIMINARY" }] as const;
  })));
  const totalPages = Math.max(1, Math.ceil(totalNotices / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const showingFrom = totalNotices === 0 ? 0 : skip + 1;
  const showingTo = Math.min(skip + notices.length, totalNotices);

  return {
    session,
    notices: notices.map(notice => ({ ...notice, ...financials.get(notice.id)! })),
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
