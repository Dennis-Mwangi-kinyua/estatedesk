import type { IssueStatusFilter, OrgIssue } from "../_lib/types";
import { StatusActionButton } from "./status-action-button";

export function IssueDetailsStatusActions({
  issue,
  currentPage,
  activeFilter,
  latestReportStatus,
}: {
  issue: OrgIssue;
  currentPage: number;
  activeFilter: IssueStatusFilter;
  latestReportStatus?: string;
}) {
  return (
    <>
      <div className="mt-5 flex flex-wrap gap-3">
        {issue.status === "OPEN" ? (
          <StatusActionButton
            issueId={issue.id}
            currentPage={currentPage}
            activeFilter={activeFilter}
            status="IN_PROGRESS"
            label="Move to progress"
            className="inline-flex items-center justify-center rounded-[18px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
          />
        ) : null}

        {issue.status === "IN_PROGRESS" ? (
          <span className="inline-flex items-center justify-center rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {latestReportStatus === "SUBMITTED"
              ? "Review caretaker report"
              : "Awaiting caretaker report"}
          </span>
        ) : null}

        {issue.status === "RESOLVED" ? (
          <span className="inline-flex items-center justify-center rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Waiting tenant confirmation
          </span>
        ) : null}

        {(issue.status === "OPEN" || issue.status === "IN_PROGRESS") ? (
          <StatusActionButton
            issueId={issue.id}
            currentPage={currentPage}
            activeFilter={activeFilter}
            status="CANCELLED"
            label="Cancel"
            className="inline-flex items-center justify-center rounded-[18px] border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700"
          />
        ) : null}

        {(issue.status === "RESOLVED" ||
          issue.status === "CLOSED" ||
          issue.status === "CANCELLED") ? (
          <StatusActionButton
            issueId={issue.id}
            currentPage={currentPage}
            activeFilter={activeFilter}
            status="OPEN"
            label="Reopen"
            className="inline-flex items-center justify-center rounded-[18px] border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700"
          />
        ) : null}
      </div>

      {issue.resolutionNotes ? (
        <div className="mt-4 rounded-[22px] bg-muted/70 p-4">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
            Resolution Notes
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            {issue.resolutionNotes}
          </p>
        </div>
      ) : null}
    </>
  );
}