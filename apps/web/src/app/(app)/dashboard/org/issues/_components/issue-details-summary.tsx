import type { OrgIssue } from "../_lib/types";
import {
  formatDate,
  getIssueUnitLabel,
  getPriorityClasses,
  getStatusClasses,
} from "../_lib/helpers";

export function IssueDetailsSummary({ issue }: { issue: OrgIssue }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Issue overview
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusClasses(
            issue.status,
          )}`}
        >
          {issue.status.replaceAll("_", " ")}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getPriorityClasses(
            issue.priority,
          )}`}
        >
          {issue.priority}
        </span>
      </div>



      <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">
        {issue.description}
      </p>

      <div className="mt-4 rounded-[22px] bg-muted px-4 py-3">
        <p className="text-sm font-medium text-foreground">
          {getIssueUnitLabel(issue)}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[20px] bg-muted/70 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Created
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {formatDate(issue.createdAt)}
          </p>
        </div>

        <div className="rounded-[20px] bg-muted/70 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Resolved
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {formatDate(issue.resolvedAt)}
          </p>
        </div>

        <div className="rounded-[20px] bg-muted/70 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Allocated To
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {issue.assignedTo?.fullName ??
              issue.assignedTo?.email ??
              "Unassigned"}
          </p>
        </div>

        <div className="rounded-[20px] bg-muted/70 p-4">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Reported By
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {issue.reportedBy?.fullName ??
              issue.reportedBy?.email ??
              "Unknown"}
          </p>
        </div>
      </div>


    </>
  );
}
