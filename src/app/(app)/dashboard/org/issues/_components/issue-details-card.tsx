import type { CaretakerOption, OrgIssue } from "../_lib/types";
import {
  formatDate,
  getIssueUnitLabel,
  getPriorityClasses,
  getStatusClasses,
} from "../_lib/helpers";
import { SurfaceCard } from "./issues-page-shell";
import { IssueAssignmentCard } from "./issue-assignment-card";
import { IssueProgressTracker } from "./issue-progress-tracker";
import { updateIssueStatusAction } from "../actions";

function StatusActionButton({
  issueId,
  currentPage,
  status,
  label,
  className,
}: {
  issueId: string;
  currentPage: number;
  status: string;
  label: string;
  className: string;
}) {
  return (
    <form action={updateIssueStatusAction}>
      <input type="hidden" name="issueId" value={issueId} />
      <input type="hidden" name="page" value={String(currentPage)} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}

export function IssueDetailsCard({
  issue,
  caretakers,
  currentPage,
  canAssignCaretaker,
}: {
  issue: OrgIssue | null;
  caretakers: CaretakerOption[];
  currentPage: number;
  canAssignCaretaker: boolean;
}) {
  if (!issue) return null;

  return (
    <SurfaceCard className="overflow-hidden p-4 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
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

          <div className="mt-4 rounded-[22px] bg-[#f7f7fa] px-4 py-3">
            <p className="text-sm font-medium text-neutral-700">
              {getIssueUnitLabel(issue)}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[20px] bg-[#fafafa] p-4">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                Created
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-950">
                {formatDate(issue.createdAt)}
              </p>
            </div>

            <div className="rounded-[20px] bg-[#fafafa] p-4">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                Resolved
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-950">
                {formatDate(issue.resolvedAt)}
              </p>
            </div>

            <div className="rounded-[20px] bg-[#fafafa] p-4">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                Allocated To
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-950">
                {issue.assignedTo?.fullName ??
                  issue.assignedTo?.email ??
                  "Unassigned"}
              </p>
            </div>

            <div className="rounded-[20px] bg-[#fafafa] p-4">
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

          <div className="mt-5 flex flex-wrap gap-3">
            {issue.status === "OPEN" ? (
              <StatusActionButton
                issueId={issue.id}
                currentPage={currentPage}
                status="IN_PROGRESS"
                label="Move to progress"
                className="inline-flex items-center justify-center rounded-[18px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
              />
            ) : null}

            {issue.status === "IN_PROGRESS" ? (
              <StatusActionButton
                issueId={issue.id}
                currentPage={currentPage}
                status="RESOLVED"
                label="Mark resolved"
                className="inline-flex items-center justify-center rounded-[18px] bg-emerald-600 px-4 py-3 text-sm font-medium text-white"
              />
            ) : null}

            {issue.status === "RESOLVED" ? (
              <StatusActionButton
                issueId={issue.id}
                currentPage={currentPage}
                status="CLOSED"
                label="Close ticket"
                className="inline-flex items-center justify-center rounded-[18px] bg-sky-600 px-4 py-3 text-sm font-medium text-white"
              />
            ) : null}

            {(issue.status === "OPEN" || issue.status === "IN_PROGRESS") ? (
              <StatusActionButton
                issueId={issue.id}
                currentPage={currentPage}
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
                status="OPEN"
                label="Reopen"
                className="inline-flex items-center justify-center rounded-[18px] border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700"
              />
            ) : null}
          </div>

          {issue.resolutionNotes ? (
            <div className="mt-4 rounded-[22px] bg-[#fafafa] p-4">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                Resolution Notes
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                {issue.resolutionNotes}
              </p>
            </div>
          ) : null}
        </div>

        {canAssignCaretaker ? (
          <IssueAssignmentCard
            issueId={issue.id}
            currentPage={currentPage}
            selectedCaretakerId={issue.assignedTo?.id}
            caretakers={caretakers}
          />
        ) : null}
      </div>
    </SurfaceCard>
  );
}