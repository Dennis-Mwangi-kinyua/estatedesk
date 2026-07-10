import { Prisma, TicketPriority, TicketStatus } from "@prisma/client";
import { getPagination } from "@/lib/db/pagination";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { ISSUES_LOAD_ERROR_MESSAGE } from "@/app/(app)/dashboard/caretaker/issues/_lib/helpers";
import { PAGE_SIZE } from "./types";
import type { IssueDataResult } from "./types";

const issueInclude = {
  property: {
    select: {
      id: true,
      name: true,
    },
  },
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
  assignedTo: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
  },
  reportedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
  },
  resolutionReports: {
    orderBy: {
      submittedAt: "desc" as const,
    },
    take: 1,
    select: {
      id: true,
      status: true,
      workSummary: true,
      materialsUsed: true,
      tenantInstructions: true,
      officeNotes: true,
      submittedAt: true,
    },
  },
} as const;

export async function getIssueData({
  orgId,
  issueWhere,
  today,
  page = 1,
}: {
  orgId: string;
  issueWhere: Prisma.IssueTicketWhereInput;
  today: Date;
  page?: number;
}): Promise<IssueDataResult> {
  try {
    const { page: currentPage, skip, take } = getPagination({
      page,
      pageSize: PAGE_SIZE,
    });

    const [
      openIssues,
      inProgressIssues,
      resolvedTodayIssues,
      urgentIssues,
      totalFiltered,
      issues,
    ] = await retryTransientDatabaseOperation(
      () =>
        Promise.all([
      prisma.issueTicket.count({
        where: {
          orgId,
          status: TicketStatus.OPEN,
        },
      }),

      prisma.issueTicket.count({
        where: {
          orgId,
          status: TicketStatus.IN_PROGRESS,
        },
      }),

      prisma.issueTicket.count({
        where: {
          orgId,
          status: {
            in: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
          },
          resolvedAt: {
            gte: today,
          },
        },
      }),

      prisma.issueTicket.count({
        where: {
          orgId,
          priority: TicketPriority.URGENT,
          status: {
            notIn: [
              TicketStatus.RESOLVED,
              TicketStatus.CLOSED,
              TicketStatus.CANCELLED,
            ],
          },
        },
      }),

      prisma.issueTicket.count({ where: issueWhere }),

      prisma.issueTicket.findMany({
        where: issueWhere,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take,
        include: issueInclude,
      }),
        ]),
      { label: "caretaker issues page data" },
    );

    const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const showingFrom = totalFiltered === 0 ? 0 : skip + 1;
    const showingTo = Math.min(skip + issues.length, totalFiltered);

    return {
      ok: true,
      openIssues,
      inProgressIssues,
      resolvedTodayIssues,
      urgentIssues,
      issues,
      totalFiltered,
      currentPage: safePage,
      totalPages,
      showingFrom,
      showingTo,
    };
  } catch (error) {
    logServerError("caretaker.issues.load", error);

    return {
      ok: false,
      openIssues: 0,
      inProgressIssues: 0,
      resolvedTodayIssues: 0,
      urgentIssues: 0,
      issues: [],
      errorMessage: ISSUES_LOAD_ERROR_MESSAGE,
      totalFiltered: 0,
      currentPage: 1,
      totalPages: 1,
      showingFrom: 0,
      showingTo: 0,
    };
  }
}