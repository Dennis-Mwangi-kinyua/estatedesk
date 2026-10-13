import { CalendarDays, MapPin, UserRound } from "lucide-react";
import { ResolutionForm } from "@/app/(app)/dashboard/tenant/issues/_components/resolution-form";
import {
  formatDate,
  getPriorityClasses,
  getStatusClasses,
} from "@/app/(app)/dashboard/tenant/issues/_lib/helpers";
import type { TenantIssue } from "@/app/(app)/dashboard/tenant/issues/_lib/types";

function getUnitLabel(issue: TenantIssue) {
  return issue.unit
    ? `${issue.unit.property.name} • Unit ${issue.unit.houseNo}`
    : (issue.property?.name ?? "Property issue");
}

export function IssueHistoryCards({ issues }: { issues: TenantIssue[] }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {issues.map((issue) => {
        const unitLabel = getUnitLabel(issue);
        const latestReport = issue.resolutionReports[0] ?? null;

        return (
          <article
            key={issue.id}
            className="flex min-w-0 flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words text-base font-semibold leading-6 text-foreground">
                  {issue.title}
                </h3>
                <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
                  <MapPin aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                  {unitLabel}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClasses(
                    issue.status,
                  )}`}
                >
                  {issue.status.replaceAll("_", " ")}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getPriorityClasses(
                    issue.priority,
                  )}`}
                >
                  {issue.priority}
                </span>
              </div>
            </div>

            <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">
              {issue.description}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs sm:grid-cols-3">
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays aria-hidden="true" className="size-3.5 shrink-0" />
                {formatDate(issue.createdAt)}
              </p>
              <p className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <UserRound aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="truncate">{issue.assignedTo?.fullName ?? "Not assigned"}</span>
              </p>
              {issue.photoAsset ? <p className="text-muted-foreground">Photo attached</p> : null}
            </div>

            {latestReport?.status === "OFFICE_APPROVED" ? (
              <details className="mt-3 border-t border-border pt-3">
                <summary className="cursor-pointer text-sm font-medium text-primary">
                  Review completed work
                </summary>
                <ResolutionForm issue={issue} latestReport={latestReport} />
              </details>
            ) : issue.resolutionNotes ? (
              <details className="mt-3 border-t border-border pt-3">
                <summary className="cursor-pointer text-sm font-medium text-foreground/80">
                  View resolution notes
                </summary>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">
                  {issue.resolutionNotes}
                </p>
              </details>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
