import type { TicketStatus, IssueResolutionReportStatus } from "@prisma/client";

type ProgressInput = {
  status: TicketStatus;
  createdAt: Date;
  resolvedAt: Date | null;
  assignedTo: { fullName: string | null; email: string | null } | null;
  resolutionReports: Array<{ status: IssueResolutionReportStatus; submittedAt: Date; officeReviewedAt: Date | null; tenantConfirmedAt: Date | null }>;
};

/** Read recorded milestones without treating a rejected report as completed work. */
export function getIssueProgress(issue: ProgressInput) {
  const report = issue.status === "OPEN" ? null : issue.resolutionReports[0];
  const rejected = report?.status === "REJECTED";
  const reviewed = report?.status === "OFFICE_APPROVED" || report?.status === "TENANT_CONFIRMED";
  const confirmed = report?.status === "TENANT_CONFIRMED";
  const closed = issue.status === "CLOSED";
  const steps = [
    { label: "Reported", complete: true, caption: "Issue submitted", at: issue.createdAt },
    { label: "Assigned", complete: Boolean(issue.assignedTo), caption: issue.assignedTo?.fullName || issue.assignedTo?.email || "Awaiting allocation", at: null },
    { label: "Work in progress", complete: Boolean(report && !rejected) || issue.status === "RESOLVED" || closed, caption: rejected ? "Further work required" : issue.status === "IN_PROGRESS" ? "Assigned staff working on the issue" : "Work and repairs", at: null },
    { label: "Completion report", complete: Boolean(report && !rejected), caption: rejected ? "Report rejected — resubmission required" : report ? "Completion report submitted" : "Awaiting staff report", at: report?.submittedAt ?? null },
    { label: "Office review", complete: reviewed, caption: reviewed ? "Report approved" : rejected ? "Changes requested" : "Review and approve the work", at: report?.officeReviewedAt ?? null },
    { label: "Closure", complete: closed || confirmed, caption: confirmed ? "Tenant confirmed completion" : closed ? "Issue closed" : "Awaiting tenant confirmation", at: report?.tenantConfirmedAt ?? (closed ? issue.resolvedAt : null) },
  ];
  const currentIndex = issue.status === "CANCELLED" || closed || confirmed ? -1
    : rejected ? 2 : issue.status === "RESOLVED" || reviewed ? 5
    : report ? 4 : issue.status === "IN_PROGRESS" ? 2
    : issue.assignedTo ? 2 : 1;
  return { steps, currentIndex, cancelled: issue.status === "CANCELLED" };
}
