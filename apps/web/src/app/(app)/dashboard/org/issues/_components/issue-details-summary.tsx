import type { OrgIssue } from "../_lib/types";
import {
  formatDate,
  getIssueUnitLabel,
  getPriorityClasses,
  getStatusClasses,
} from "../_lib/helpers";
import { IssueProgressTracker } from "./issue-progress-tracker";

export function IssueDetailsSummary({ issue }: { issue: OrgIssue }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-600">
          Selected Issue
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

      <h2 className="mt-3 text-[26px] font-semibold tracking-tight text-neutral-950">
        {issue.title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-neutral-500">
        {issue.description}
      </p>

      <div className="mt-4 rounded-[22px] bg-muted px-4 py-3">
        <p className="text-sm font-medium text-neutral-700">
          {getIssueUnitLabel(issue)}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[20px] bg-muted/70 p-4">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
            Created
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-950">
            {formatDate(issue.createdAt)}
          </p>
        </div>

        <div className="rounded-[20px] bg-muted/70 p-4">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
            Resolved
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-950">
            {formatDate(issue.resolvedAt)}
          </p>
        </div>

        <div className="rounded-[20px] bg-muted/70 p-4">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
            Allocated To
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-950">
            {issue.assignedTo?.fullName ??
              issue.assignedTo?.email ??
              "Unassigned"}
          </p>
        </div>

        <div className="rounded-[20px] bg-muted/70 p-4">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
            Reported By
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-950">
            {issue.reportedBy?.fullName ??
              issue.reportedBy?.email ??
              "Unknown"}
          </p>
        </div>
      </div>

      <IssueProgressTracker issue={issue} />
    </>
  );
}