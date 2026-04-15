import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import {
  HISTORY_PAGE_SIZE,
  ORG_ISSUE_ROLES,
  orgIssueArgs,
  orgMembershipArgs,
  type CaretakerOption,
  type OrgIssuesPageData,
  type IssuesSearchParams,
} from "./types";
import {
  canAssignCaretakerRole,
  clampPage,
  getNewIssueCount,
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

export async function getOrgIssuesPageData(
  searchParamsPromise?: Promise<IssuesSearchParams>,
): Promise<OrgIssuesPageData> {
  const membership = await getCurrentOrgContext();
  const resolvedSearchParams = (await searchParamsPromise) ?? {};
  const requestedPage = Number(resolvedSearchParams.page ?? "1");
  const canAssignCaretaker = canAssignCaretakerRole(membership.role);

  const [issues, caretakerMemberships] = await Promise.all([
    prisma.issueTicket.findMany({
      where: {
        orgId: membership.orgId,
      },
      orderBy: [{ createdAt: "desc" }],
      ...orgIssueArgs,
      take: 100,
    }),
    prisma.membership.findMany({
      where: {
        orgId: membership.orgId,
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
    }),
  ]);

  const caretakers: CaretakerOption[] = Array.from(
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

  const totalPages = Math.max(1, Math.ceil(issues.length / HISTORY_PAGE_SIZE));
  const currentPage = clampPage(requestedPage, totalPages);
  const historyStart = (currentPage - 1) * HISTORY_PAGE_SIZE;
  const historyEnd = historyStart + HISTORY_PAGE_SIZE;
  const paginatedIssues = issues.slice(historyStart, historyEnd);

  const latestIssue = issues[0] ?? null;
  const selectedIssue =
    issues.find((issue) => issue.id === resolvedSearchParams.issueId) ??
    latestIssue;

  return {
    membership,
    issues,
    caretakers,
    canAssignCaretaker,
    selectedIssue,
    paginatedIssues,
    currentPage,
    totalPages,
    historyStart,
    historyEnd,
    stats: {
      totalIssues: issues.length,
      newIssues: getNewIssueCount(issues),
      inProgressIssues: issues.filter(
        (issue) => issue.status === "IN_PROGRESS",
      ).length,
      resolvedIssues: issues.filter(
        (issue) => issue.status === "RESOLVED" || issue.status === "CLOSED",
      ).length,
      cancelledIssues: issues.filter(
        (issue) => issue.status === "CANCELLED",
      ).length,
    },
  };
}