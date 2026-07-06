import { confirmIssueResolutionAction } from "@/app/(app)/dashboard/tenant/issues/actions";
import type { TenantIssue } from "@/app/(app)/dashboard/tenant/issues/_lib/types";

export function ResolutionForm({
  issue,
  latestReport,
  compact = false,
}: {
  issue: TenantIssue;
  latestReport: TenantIssue["resolutionReports"][number];
  compact?: boolean;
}) {
  return (
    <form
      action={confirmIssueResolutionAction}
      className={
        compact
          ? "min-w-[220px] rounded-[16px] border border-emerald-100 bg-emerald-50/60 p-3"
          : "mt-3 rounded-[16px] border border-emerald-100 bg-emerald-50/60 px-3 py-3"
      }
    >
      <input type="hidden" name="reportId" value={latestReport.id} />
      <input type="hidden" name="issueId" value={issue.id} />
      <p
        className={
          compact
            ? "text-xs font-semibold text-foreground"
            : "text-sm font-semibold text-foreground"
        }
      >
        {compact ? "Confirm report" : "Confirm caretaker report"}
      </p>
      {!compact ? (
        <p className="mt-2 text-sm leading-6 text-foreground/80">
          {latestReport.workSummary}
        </p>
      ) : null}
      {!compact && latestReport.officeNotes ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Office note: {latestReport.officeNotes}
        </p>
      ) : null}
      <textarea
        name="tenantFeedback"
        rows={2}
        placeholder={
          compact
            ? "Feedback (optional)"
            : "Feedback before closing (optional)"
        }
        className={
          compact
            ? "mt-2 w-full rounded-[12px] border border-border bg-card px-2 py-2 text-xs text-foreground outline-none transition focus:border-neutral-400"
            : "mt-3 w-full rounded-[14px] border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus:border-neutral-400"
        }
      />
      <button
        type="submit"
        className={
          compact
            ? "mt-2 inline-flex w-full items-center justify-center rounded-[12px] bg-emerald-600 px-3 py-2 text-xs font-medium text-white"
            : "mt-2 inline-flex items-center justify-center rounded-[14px] bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white"
        }
      >
        {compact ? "Confirm and close" : "Confirm work and close ticket"}
      </button>
    </form>
  );
}