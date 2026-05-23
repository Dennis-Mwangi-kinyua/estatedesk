import type { CaretakerOption, IssueStatusFilter, OrgIssue } from "../_lib/types";
import {
  formatDate,
  getIssueUnitLabel,
  getPriorityClasses,
  getStatusClasses,
} from "../_lib/helpers";
import { SurfaceCard } from "./issues-page-shell";
import { IssueAssignmentCard } from "./issue-assignment-card";
import { IssueProgressTracker } from "./issue-progress-tracker";
import {
  approveIssueResolutionReportAction,
  rejectIssueResolutionReportAction,
  updateIssueStatusAction,
} from "../actions";

function StatusActionButton({
  issueId,
  currentPage,
  activeFilter,
  status,
  label,
  className,
  notes,
}: {
  issueId: string;
  currentPage: number;
  activeFilter: IssueStatusFilter;
  status: string;
  label: string;
  className: string;
  notes?: boolean;
}) {
  return (
    <form action={updateIssueStatusAction} className={notes ? "space-y-2" : ""}>
      <input type="hidden" name="issueId" value={issueId} />
      <input type="hidden" name="page" value={String(currentPage)} />
      <input type="hidden" name="filter" value={activeFilter} />
      <input type="hidden" name="status" value={status} />
      {notes ? (
        <textarea
          name="resolutionNotes"
          rows={3}
          placeholder="Add a short resolution note for the tenant..."
          className="w-full rounded-[18px] border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
        />
      ) : null}
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
                activeFilter={activeFilter}
                status="IN_PROGRESS"
                label="Move to progress"
                className="inline-flex items-center justify-center rounded-[18px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
              />
            ) : null}

            {issue.status === "IN_PROGRESS" ? (
              <span className="inline-flex items-center justify-center rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                {latestReport?.status === "SUBMITTED"
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
            <div className="mt-4 rounded-[22px] bg-[#fafafa] p-4">
              <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                Resolution Notes
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-700">
                {issue.resolutionNotes}
              </p>
            </div>
          ) : null}

          {latestReport ? (
            <div className="mt-4 rounded-[22px] border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                    Caretaker Report
                  </p>
                  <p className="mt-1 text-sm font-semibold text-neutral-950">
                    {latestReport.caretaker.fullName ??
                      latestReport.caretaker.email ??
                      "Caretaker"}{" "}
                    submitted on {formatDate(latestReport.submittedAt)}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-600">
                  {latestReport.status.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-[#fafafa] p-4 sm:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                    Work Done
                  </p>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">
                    {latestReport.workSummary}
                  </p>
                </div>

                {latestReport.materialsUsed ? (
                  <div className="rounded-[18px] bg-[#fafafa] p-4">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                      Materials
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-700">
                      {latestReport.materialsUsed}
                    </p>
                  </div>
                ) : null}

                {latestReport.tenantInstructions ? (
                  <div className="rounded-[18px] bg-[#fafafa] p-4">
                    <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                      Tenant Notes
                    </p>
                    <p className="mt-2 text-sm leading-6 text-neutral-700">
                      {latestReport.tenantInstructions}
                    </p>
                  </div>
                ) : null}
              </div>

              {latestReport.status === "SUBMITTED" ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <form
                    action={approveIssueResolutionReportAction}
                    className="rounded-[18px] border border-emerald-100 bg-emerald-50/60 p-3"
                  >
                    <input type="hidden" name="reportId" value={latestReport.id} />
                    <input type="hidden" name="issueId" value={issue.id} />
                    <input type="hidden" name="page" value={String(currentPage)} />
                    <input type="hidden" name="filter" value={activeFilter} />
                    <textarea
                      name="officeNotes"
                      rows={2}
                      placeholder="Office note for tenant (optional)"
                      className="w-full rounded-[14px] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                    />
                    <button
                      type="submit"
                      className="mt-2 inline-flex items-center justify-center rounded-[14px] bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white"
                    >
                      Approve and send to tenant
                    </button>
                  </form>

                  <form
                    action={rejectIssueResolutionReportAction}
                    className="rounded-[18px] border border-orange-100 bg-orange-50/60 p-3"
                  >
                    <input type="hidden" name="reportId" value={latestReport.id} />
                    <input type="hidden" name="issueId" value={issue.id} />
                    <input type="hidden" name="page" value={String(currentPage)} />
                    <input type="hidden" name="filter" value={activeFilter} />
                    <textarea
                      name="officeNotes"
                      rows={2}
                      placeholder="What should the caretaker fix?"
                      className="w-full rounded-[14px] border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-400"
                    />
                    <button
                      type="submit"
                      className="mt-2 inline-flex items-center justify-center rounded-[14px] bg-orange-600 px-4 py-2.5 text-sm font-medium text-white"
                    >
                      Return for more work
                    </button>
                  </form>
                </div>
              ) : null}

              {latestReport.status === "OFFICE_APPROVED" ? (
                <p className="mt-4 rounded-[18px] bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  The tenant has been asked to confirm this report. The ticket
                  will close after their confirmation.
                </p>
              ) : null}

              {latestReport.status === "TENANT_CONFIRMED" ? (
                <p className="mt-4 rounded-[18px] bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Tenant confirmed the work and the ticket is closed.
                </p>
              ) : null}
            </div>
          ) : null}
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
