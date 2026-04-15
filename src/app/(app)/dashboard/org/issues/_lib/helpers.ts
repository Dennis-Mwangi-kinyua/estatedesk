import { TicketPriority, TicketStatus } from "@prisma/client";
import {
  ISSUE_PAGE_PATH,
  ORG_ASSIGNMENT_ROLES,
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

export function buildIssuesHref(page: number, issueId?: string) {
  const params = new URLSearchParams();
  params.set("page", String(page));

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

export function getIssueUnitLabel(issue: Pick<OrgIssue, "property" | "unit">) {
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