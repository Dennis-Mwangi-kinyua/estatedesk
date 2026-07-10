import type { IssueStatusFilter, OrgIssue } from "../_lib/types";
import { formatDate } from "../_lib/helpers";
import {
  approveIssueResolutionReportAction,
  rejectIssueResolutionReportAction,
} from "../actions";

export function IssueResolutionReportSection({
  issue,
  currentPage,
  activeFilter,
}: {
  issue: OrgIssue;
  currentPage: number;
  activeFilter: IssueStatusFilter;
}) {
  const latestReport = issue.resolutionReports[0] ?? null;

  if (!latestReport) return null;

  return (
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
        <div className="rounded-[18px] bg-muted/70 p-4 sm:col-span-2">
          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
            Work Done
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            {latestReport.workSummary}
          </p>
        </div>

        {latestReport.materialsUsed ? (
          <div className="rounded-[18px] bg-muted/70 p-4">
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">
              Materials
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              {latestReport.materialsUsed}
            </p>
          </div>
        ) : null}

        {latestReport.tenantInstructions ? (
          <div className="rounded-[18px] bg-muted/70 p-4">
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
  );
}