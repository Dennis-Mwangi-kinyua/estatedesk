import Link from "next/link";
import { TicketStatus } from "@prisma/client";
import {
  getCaretakerIssueHref,
  getCaretakerUnitHref,
} from "@/app/(app)/dashboard/caretaker/_lib/paths";
import { IssueSlaBadge } from "@/app/(app)/dashboard/caretaker/_components/issue-sla-badge";
import { CompletionReportForm } from "./completion-report-form";
import { IssueCardActions } from "./issue-card-actions";
import {
  formatDateTime,
  getPriorityClass,
  getStatusClass,
} from "@/app/(app)/dashboard/caretaker/issues/_lib/helpers";
import type { IssueWithRelations } from "@/app/(app)/dashboard/caretaker/issues/_lib/types";

type IssueCardProps = {
  issue: IssueWithRelations;
  currentUserId: string;
};

export function IssueCard({ issue, currentUserId }: IssueCardProps) {
  const propertyName = issue.unit?.property.name ?? issue.property?.name ?? "—";
  const buildingName = issue.unit?.building?.name ?? "—";
  const unitName = issue.unit?.houseNo ?? "—";
  const latestReport = issue.resolutionReports[0] ?? null;
  const canSubmitReport =
    issue.status === TicketStatus.IN_PROGRESS &&
    issue.assignedTo?.id === currentUserId &&
    (!latestReport || latestReport.status === "REJECTED");

  return (
    <article className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/25 hover:shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusClass(
                issue.status,
              )}`}
            >
              {issue.status.replaceAll("_", " ")}
            </span>

            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getPriorityClass(
                issue.priority,
              )}`}
            >
              {issue.priority}
            </span>
            <IssueSlaBadge
              createdAt={issue.createdAt}
              priority={issue.priority}
              status={issue.status}
            />
          </div>

          <h3 className="mt-3 text-base font-semibold text-foreground">
            <Link
              href={getCaretakerIssueHref(issue.id)}
              className="transition hover:text-primary"
            >
              {issue.title}
            </Link>
          </h3>

          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {issue.description}
          </p>
        </div>

        <div className="text-sm text-muted-foreground sm:text-right">
          <p>Created</p>
          <p className="font-medium text-foreground">
            {formatDateTime(issue.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Property
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {propertyName}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Building
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {buildingName}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Unit
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {unitName}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Assigned to
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {issue.assignedTo?.fullName ?? "Unassigned"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Reported by{" "}
            <span className="font-medium text-foreground">
              {issue.reportedBy?.fullName ?? "Unknown"}
            </span>
          </p>
          {issue.unit?.id ? (
            <Link
              href={getCaretakerUnitHref(issue.unit.id)}
              className="text-xs font-semibold text-primary transition hover:text-primary/80"
            >
              Open unit profile
            </Link>
          ) : null}
        </div>

        <span className="text-xs text-muted-foreground">
          Last updated {formatDateTime(issue.updatedAt)}
        </span>
      </div>

      <IssueCardActions issue={issue} currentUserId={currentUserId} />

      {issue.resolutionNotes && issue.status === TicketStatus.IN_PROGRESS ? (
        <div className="mt-4 rounded-2xl border border-border bg-muted/10 p-4">
          <p className="text-sm font-semibold text-foreground">Progress notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {issue.resolutionNotes}
          </p>
        </div>
      ) : null}

      {latestReport ? (
        <div className="mt-4 rounded-2xl border border-border bg-muted/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">
              Completion report
            </p>
            <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-muted-foreground">
              {latestReport.status.replaceAll("_", " ")}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {latestReport.workSummary}
          </p>
          {latestReport.officeNotes ? (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Office notes: {latestReport.officeNotes}
            </p>
          ) : null}
        </div>
      ) : null}

      {canSubmitReport ? (
        <div className="mt-4">
          <CompletionReportForm issueId={issue.id} />
        </div>
      ) : null}
    </article>
  );
}