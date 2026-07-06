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
    <SurfaceCard className="overflow-hidden p-4 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <IssueDetailsSummary issue={issue} />

          <IssueDetailsStatusActions
            issue={issue}
            currentPage={currentPage}
            activeFilter={activeFilter}
            latestReportStatus={latestReport?.status}
          />

          <IssueResolutionReportSection
            issue={issue}
            currentPage={currentPage}
            activeFilter={activeFilter}
          />
        </div>

        {canAssignCaretaker ? (
          <IssueAssignmentCard
            issueId={issue.id}
            currentPage={currentPage}
            activeFilter={activeFilter}
            selectedCaretakerId={issue.assignedTo?.id}
            caretakers={caretakers}
          />
        ) : null}
      </div>
    </SurfaceCard>
  );
}