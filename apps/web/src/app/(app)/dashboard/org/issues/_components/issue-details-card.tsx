import type { CaretakerOption, IssueStatusFilter, OrgIssue } from "../_lib/types";
import { SurfaceCard } from "./issues-page-shell";
import { IssueAssignmentCard } from "./issue-assignment-card";
import { IssueDetailsStatusActions } from "./issue-details-status-actions";
import { IssueDetailsSummary } from "./issue-details-summary";
import { IssueResolutionReportSection } from "./issue-resolution-report-section";

export function IssueDetailsCard({
  issue,
  caretakers,
  currentPage,
  activeFilter,
  canAssignCaretaker,
}: {
  issue: OrgIssue | null;
  caretakers: CaretakerOption[];
  currentPage: number;
  activeFilter: IssueStatusFilter;
  canAssignCaretaker: boolean;
}) {
  if (!issue) return null;

  const latestReport = issue.resolutionReports[0] ?? null;

  return (
    <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
      <div className="min-w-0 space-y-5">
        <SurfaceCard className="min-w-0 p-5 sm:p-6"><IssueDetailsSummary issue={issue} /></SurfaceCard>
        <SurfaceCard className="min-w-0 p-5 sm:p-6"><h2 className="text-lg font-semibold text-foreground">Actions and resolution</h2><IssueDetailsStatusActions issue={issue} currentPage={currentPage} activeFilter={activeFilter} latestReportStatus={latestReport?.status} /><IssueResolutionReportSection issue={issue} currentPage={currentPage} activeFilter={activeFilter} /></SurfaceCard>
      </div>
      <div className="min-w-0 space-y-5">
        <SurfaceCard className="min-w-0 space-y-4 p-5 sm:p-6"><h2 className="text-lg font-semibold text-foreground">Assignment and responsibility</h2><dl className="space-y-4 text-sm"><div><dt className="text-muted-foreground">Allocated to</dt><dd className="mt-1 break-words font-semibold text-foreground">{issue.assignedTo?.fullName || issue.assignedTo?.email || "Not assigned yet"}</dd></div><div><dt className="text-muted-foreground">Allocated by</dt><dd className="mt-1 break-words font-medium text-foreground">{issue.assignedBy?.fullName || issue.assignedBy?.email || "Not recorded"}</dd></div>{issue.assignedTo?.phone ? <div><dt className="text-muted-foreground">Contact number</dt><dd className="mt-1 font-medium text-foreground">{issue.assignedTo.phone}</dd></div> : null}</dl></SurfaceCard>
        {canAssignCaretaker && !["CLOSED", "CANCELLED", "RESOLVED"].includes(issue.status) ? <IssueAssignmentCard issueId={issue.id} currentPage={currentPage} activeFilter={activeFilter} selectedCaretakerId={issue.assignedTo?.id} caretakers={caretakers} /> : null}
      </div>
    </div>
  );
}
