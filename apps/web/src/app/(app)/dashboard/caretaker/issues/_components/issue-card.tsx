import Link from "@/components/navigation/workspace-link";
import {
  getCaretakerIssueHref,
  getCaretakerUnitHref,
} from "@/app/(app)/dashboard/caretaker/_lib/paths";
import { IssueSlaBadge } from "@/app/(app)/dashboard/caretaker/_components/issue-sla-badge";
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

export function IssueCard({ issue }: IssueCardProps) {
  const propertyName = issue.unit?.property.name ?? issue.property?.name ?? "—";
  const buildingName = issue.unit?.building?.name ?? "—";
  const unitName = issue.unit?.houseNo ?? "—";

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

      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Property
          </p>
          <p className="mt-1 break-words text-sm font-medium text-foreground">
            {propertyName}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Building
          </p>
          <p className="mt-1 break-words text-sm font-medium text-foreground">
            {buildingName}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Unit
          </p>
          <p className="mt-1 break-words text-sm font-medium text-foreground">
            {unitName}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Assigned to
          </p>
          <p className="mt-1 break-words text-sm font-medium text-foreground">
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

      <div className="mt-4 border-t border-border pt-4"><Link href={getCaretakerIssueHref(issue.id)} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Open issue and workflow</Link></div>
    </article>
  );
}