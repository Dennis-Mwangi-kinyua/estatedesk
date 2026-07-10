import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { encodePublicId } from "@/lib/public-id";
import { IssueSlaBadge } from "@/app/(app)/dashboard/caretaker/_components/issue-sla-badge";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import {
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  formatDateTime,
  getPriorityClass,
  getStatusClass,
} from "@/app/(app)/dashboard/caretaker/issues/_lib/helpers";
import type { CaretakerIssueDetail } from "../_lib/queries";

export function IssueDetailHeader({ issue }: { issue: CaretakerIssueDetail }) {
  const propertyName = issue.unit?.property.name ?? issue.property?.name ?? "—";
  const buildingName = issue.unit?.building?.name;
  const unitName = issue.unit?.houseNo;
  const location = [propertyName, buildingName, unitName ? `Unit ${unitName}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <Link
          href="/dashboard/caretaker/issues"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to issues
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm text-muted-foreground">Maintenance issue</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {issue.title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {location}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getStatusClass(
                issue.status,
              )}`}
            >
              {issue.status.replaceAll("_", " ")}
            </span>
            <span
              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${getPriorityClass(
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
            <Link
              href={`/print/issues/${encodePublicId(issue.id, "issue")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted/30"
            >
              <Printer className="h-3.5 w-3.5" />
              <CaretakerI18nLabel labelKey="printWorkOrder" />
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Created
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDateTime(issue.createdAt)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Last updated
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDateTime(issue.updatedAt)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Assigned to
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {issue.assignedTo?.fullName ?? "Unassigned"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}