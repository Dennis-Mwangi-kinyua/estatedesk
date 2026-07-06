import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import {
  HISTORY_PAGE_SIZE,
  ORG_ISSUE_ROLES,
  STAGE_BOARD_COLUMN_LIMIT,
  orgIssueArgs,
  orgMembershipArgs,
  type CaretakerOption,
  type IssueDetailPageData,
  type OrgIssuesPageData,
  type IssuesSearchParams,
  type OrgIssue,
} from "./types";
import {
  buildIssueFilterWhere,
  canAssignCaretakerRole,
  clampPage,
  normalizeIssueStatusFilter,
} from "./helpers";

export const getCurrentOrgContext = cache(async function getCurrentOrgContext() {
  const session = await requireUserSession();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId ?? undefined,
      role: {
        in: [...ORG_ISSUE_ROLES],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    ...orgMembershipArgs,
  });

  if (membership) {
    return membership;
  }

  const fallbackMembership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      role: {
        in: [...ORG_ISSUE_ROLES],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    ...orgMembershipArgs,
  });

  if (!fallbackMembership) {
    redirect("/dashboard");
  }

  return fallbackMembership;
});

async function loadStageBoardIssues(
  orgId: string,
  activeFilter: ReturnType<typeof normalizeIssueStatusFilter>,
): Promise<OrgIssue[]> {
  const issueQuery = {
    orderBy: [{ createdAt: "desc" as const }],
    ...orgIssueArgs,
  };

  if (activeFilter !== "all") {
    return prisma.issueTicket.findMany({
      where: buildIssueFilterWhere(orgId, activeFilter),
      ...issueQuery,
      take: STAGE_BOARD_COLUMN_LIMIT * 4,
    });
  }

  const [newIssues, progressIssues, resolvedIssues, cancelledIssues] =
    await Promise.all([
      prisma.issueTicket.findMany({
        where: buildIssueFilterWhere(orgId, "new"),
        ...issueQuery,
        take: STAGE_BOARD_COLUMN_LIMIT,
      }),
      prisma.issueTicket.findMany({
        where: buildIssueFilterWhere(orgId, "progress"),
        ...issueQuery,
        take: STAGE_BOARD_COLUMN_LIMIT,
      }),
      prisma.issueTicket.findMany({
        where: buildIssueFilterWhere(orgId, "resolved"),
        ...issueQuery,
        take: STAGE_BOARD_COLUMN_LIMIT,
      }),
      prisma.issueTicket.findMany({
        where: buildIssueFilterWhere(orgId, "cancelled"),
        ...issueQuery,
        take: STAGE_BOARD_COLUMN_LIMIT,
      }),
    ]);

  return [...newIssues, ...progressIssues, ...resolvedIssues, ...cancelledIssues];
}

export async function getOrgIssuesPageData(
  searchParamsPromise?: Promise<IssuesSearchParams>,
): Promise<OrgIssuesPageData> {
  const membership = await getCurrentOrgContext();
  const resolvedSearchParams = (await searchParamsPromise) ?? {};
  const requestedPage = Number(resolvedSearchParams.page ?? "1");
  const canAssignCaretaker = canAssignCaretakerRole(membership.role);
  const activeFilter = normalizeIssueStatusFilter(resolvedSearchParams.status);
  const filterWhere = buildIssueFilterWhere(membership.orgId, activeFilter);

  const [
    totalFiltered,
    totalIssues,
    newIssues,
    inProgressIssues,
    resolvedIssues,
    cancelledIssues,
    issues,
    selectedIssueById,
    caretakers,
  ] = await Promise.all([
    prisma.issueTicket.count({ where: filterWhere }),
    prisma.issueTicket.count({ where: { orgId: membership.orgId } }),
    prisma.issueTicket.count({
      where: buildIssueFilterWhere(membership.orgId, "new"),
    }),
    prisma.issueTicket.count({
      where: {
        orgId: membership.orgId,
        status: TicketStatus.IN_PROGRESS,
      },
    }),
    prisma.issueTicket.count({
      where: buildIssueFilterWhere(membership.orgId, "resolved"),
    }),
    prisma.issueTicket.count({
      where: {
        orgId: membership.orgId,
        status: TicketStatus.CANCELLED,
      },
    }),
    loadStageBoardIssues(membership.orgId, activeFilter),
    resolvedSearchParams.issueId
      ? prisma.issueTicket.findFirst({
          where: {
            id: resolvedSearchParams.issueId,
            orgId: membership.orgId,
          },
          ...orgIssueArgs,
        })
      : Promise.resolve(null),
    loadCaretakerOptions(membership.orgId),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalFiltered / HISTORY_PAGE_SIZE));
  const currentPage = clampPage(requestedPage, totalPages);
  const historyStart = (currentPage - 1) * HISTORY_PAGE_SIZE;

  const paginatedIssues = await prisma.issueTicket.findMany({
    where: filterWhere,
    orderBy: [{ createdAt: "desc" }],
    ...orgIssueArgs,
    skip: historyStart,
    take: HISTORY_PAGE_SIZE,
  });

  const historyEnd = Math.min(historyStart + HISTORY_PAGE_SIZE, totalFiltered);

  const selectedIssue =
    selectedIssueById ??
    paginatedIssues.find(
      (issue) => issue.id === resolvedSearchParams.issueId,
    ) ??
    paginatedIssues[0] ??
    null;

  return {
    membership,
    issues,
    totalFiltered,
    caretakers,
    canAssignCaretaker,
    selectedIssue,
    paginatedIssues,
    currentPage,
    totalPages,
    historyStart,
    historyEnd,
    stats: {
      totalIssues,
      newIssues,
      inProgressIssues,
      resolvedIssues,
      cancelledIssues,
    },
    activeFilter,
  };
}

async function loadCaretakerOptions(orgId: string): Promise<CaretakerOption[]> {
  const caretakerMemberships = await prisma.membership.findMany({
    where: {
      orgId,
      role: "CARETAKER",
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      userId: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Array.from(
    new Map(
      caretakerMemberships.map((item) => [
        item.userId,
        {
          id: item.user.id,
          fullName: item.user.fullName,
          email: item.user.email,
        },
      ]),
    ).values(),
  );
}

export async function getIssueDetailPageData(
  issueId: string,
  orgId: string,
): Promise<IssueDetailPageData> {
  const membership = await getCurrentOrgContext();

  if (membership.orgId !== orgId) {
    notFound();
  }

  const [issue, caretakers] = await Promise.all([
    prisma.issueTicket.findFirst({
      where: {
        id: issueId,
        orgId,
      },
      ...orgIssueArgs,
    }),
    loadCaretakerOptions(orgId),
  ]);

  if (!issue) {
    notFound();
  }

  return {
    membership,
    issue,
    caretakers,
    canAssignCaretaker: canAssignCaretakerRole(membership.role),
  };
}