import { Prisma, TicketPriority, TicketStatus } from "@prisma/client";
import {
  ISSUE_PAGE_PATH,
  ORG_ASSIGNMENT_ROLES,
  type IssueStatusFilter,
  type OrgIssue,
} from "./types";

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function getPriorityClasses(priority: TicketPriority) {
  switch (priority) {
    case "URGENT":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "HIGH":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "MEDIUM":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "LOW":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

export function getStatusClasses(status: TicketStatus) {
  switch (status) {
    case "OPEN":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "IN_PROGRESS":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "RESOLVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CLOSED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "CANCELLED":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

export function clampPage(page: number, totalPages: number) {
  if (Number.isNaN(page) || page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
}

export function normalizeIssueStatusFilter(value?: string): IssueStatusFilter {
  const filters: IssueStatusFilter[] = [
    "all",
    "new",
    "progress",
    "resolved",
    "cancelled",
  ];

  return filters.includes(value as IssueStatusFilter)
    ? (value as IssueStatusFilter)
    : "all";
}

export function getIssueFilterLabel(filter: IssueStatusFilter) {
  switch (filter) {
    case "new":
      return "New";
    case "progress":
      return "In Progress";
    case "resolved":
      return "Resolved";
    case "cancelled":
      return "Cancelled";
    default:
      return "All Issues";
  }
}

export function buildIssueFilterWhere(
  orgId: string,
  filter: IssueStatusFilter,
): Prisma.IssueTicketWhereInput {
  const base: Prisma.IssueTicketWhereInput = { orgId };

  switch (filter) {
    case "new":
      return {
        ...base,
        status: TicketStatus.OPEN,
        assignedToUserId: null,
      };
    case "progress":
      return {
        ...base,
        status: TicketStatus.IN_PROGRESS,
      };
    case "resolved":
      return {
        ...base,
        status: {
          in: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
        },
      };
    case "cancelled":
      return {
        ...base,
        status: TicketStatus.CANCELLED,
      };
    default:
      return base;
  }
}

export function filterIssuesByStatus(
  issues: OrgIssue[],
  filter: IssueStatusFilter,
) {
  switch (filter) {
    case "new":
      return issues.filter((issue) => issue.status === "OPEN" && !issue.assignedTo);
    case "progress":
      return issues.filter((issue) => issue.status === "IN_PROGRESS");
    case "resolved":
      return issues.filter(
        (issue) => issue.status === "RESOLVED" || issue.status === "CLOSED",
      );
    case "cancelled":
      return issues.filter((issue) => issue.status === "CANCELLED");
    default:
      return issues;
  }
}

export function buildIssuesHref(
  page: number,
  issueId?: string,
  status: IssueStatusFilter = "all",
) {
  const params = new URLSearchParams();
  params.set("page", String(page));

  if (status !== "all") {
    params.set("status", status);
  }

  if (issueId) {
    params.set("issueId", issueId);
  }

  return `${ISSUE_PAGE_PATH}?${params.toString()}`;
}

export function canAssignCaretakerRole(role: string) {
  return ORG_ASSIGNMENT_ROLES.includes(
    role as (typeof ORG_ASSIGNMENT_ROLES)[number],
  );
}

export function getIssueUnitLabel(issue: {
  property?: { name: string } | null;
  unit?: { houseNo: string; property?: { name: string } | null } | null;
}) {
  if (issue.unit?.property?.name && issue.unit.houseNo) {
    return `${issue.unit.property.name} • Unit ${issue.unit.houseNo}`;
  }

  return issue.property?.name ?? "Property issue";
}

export function getNewIssueCount(issues: OrgIssue[]) {
  return issues.filter(
    (issue) => issue.status === "OPEN" && !issue.assignedTo,
  ).length;
}
