import { Wrench } from "lucide-react";
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

export function IssueHistoryMobile({ issues }: { issues: TenantIssue[] }) {
  return (
    <div className="mt-5 space-y-3 lg:hidden">
      {issues.map((issue) => {
        const unitLabel = getUnitLabel(issue);
        const latestReport = issue.resolutionReports[0] ?? null;

        return (
          <div
            key={issue.id}
            className="rounded-[22px] ed-theme-card border border-border bg-muted/35 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {issue.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {unitLabel}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                    issue.status,
                  )}`}
                >
                  {issue.status.replaceAll("_", " ")}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getPriorityClasses(
                    issue.priority,
                  )}`}
                >
                  {issue.priority}
                </span>
              </div>
            </div>

            <div className="mt-4 rounded-[16px] border border-border/60 bg-card px-3 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Description
              </p>
              <p className="mt-1 text-sm text-foreground/80">
                {issue.description}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Created
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(issue.createdAt)}
                </p>
              </div>

              <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Resolved
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(issue.resolvedAt)}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Assigned To
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {issue.assignedTo?.fullName ?? "Unassigned"}
                </p>
              </div>

              <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Category
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Maintenance Issue
                </p>
              </div>
            </div>

            {issue.resolutionNotes ? (
              <div className="mt-3 rounded-[16px] border border-border/60 bg-card px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Resolution Notes
                </p>
                <p className="mt-1 text-sm text-foreground/80">
                  {issue.resolutionNotes}
                </p>
              </div>
            ) : null}

            {latestReport?.status === "OFFICE_APPROVED" ? (
              <ResolutionForm issue={issue} latestReport={latestReport} />
            ) : null}

            {issue.photoAsset ? (
              <div className="mt-3 rounded-[16px] border border-border/60 bg-card px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Attachment
                </p>
                <p className="mt-1 text-sm text-foreground/80">
                  Photo attached to this issue.
                </p>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-[16px] border border-neutral-300 bg-card px-4 py-3 text-sm text-muted-foreground">
                <Wrench className="mr-2 h-4 w-4" />
                Ticket tracked by management
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}