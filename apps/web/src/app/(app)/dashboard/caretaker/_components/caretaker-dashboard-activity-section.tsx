import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { TicketStatus } from "@prisma/client";
import { DeferredLink } from "@/components/navigation/app-links";
import {
  formatDateTime,
  getUnitLabel,
} from "@/app/(app)/dashboard/caretaker/_lib/helpers";
import type { RecentIssue } from "@/app/(app)/dashboard/caretaker/_lib/types";
import {
  panelShellClassName,
  SectionIntro,
} from "./caretaker-ui";

function formatStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

function isResolvedStatus(status: string) {
  return status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED;
}

function IssueStatusBadge({ status }: { status: string }) {
  const resolved = isResolvedStatus(status);

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
        resolved
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
          : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function IssueActivityIcon({ status }: { status: string }) {
  const resolved = isResolvedStatus(status);
  const Icon = resolved ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
        resolved
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      }`}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

export function CaretakerDashboardActivitySection({
  recentIssues,
}: {
  recentIssues: RecentIssue[];
}) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Recent activity"
        title="Latest updates"
        action={
          <Link
            href="/dashboard/caretaker/issues"
            className="text-sm font-medium text-primary transition hover:text-primary/80"
          >
            View all issues
          </Link>
        }
      />

      {recentIssues.length === 0 ? (
        <div className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
          No recent issue activity for your assigned apartments.
        </div>
      ) : (
        <>
          <ul className="hidden divide-y divide-border md:block">
            {recentIssues.map((issue) => (
              <li key={issue.id}>
                <DeferredLink
                  href="/dashboard/caretaker/issues"
                  className="flex items-start gap-4 px-5 py-4 transition hover:bg-muted/15 sm:px-6"
                >
                  <IssueActivityIcon status={issue.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {issue.title}
                      </p>
                      <IssueStatusBadge status={issue.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getUnitLabel(issue)} · {formatDateTime(issue.updatedAt)}
                    </p>
                  </div>
                </DeferredLink>
              </li>
            ))}
          </ul>

          <div className="space-y-3 p-4 md:hidden">
            {recentIssues.map((issue) => (
              <DeferredLink
                key={issue.id}
                href="/dashboard/caretaker/issues"
                className="block rounded-2xl border border-border bg-muted/10 p-4 transition hover:border-primary/25 hover:bg-muted/20"
              >
                <div className="flex items-start gap-3">
                  <IssueActivityIcon status={issue.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {issue.title}
                      </p>
                      <IssueStatusBadge status={issue.status} />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {getUnitLabel(issue)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updated {formatDateTime(issue.updatedAt)}
                    </p>
                  </div>
                </div>
              </DeferredLink>
            ))}
          </div>
        </>
      )}
    </section>
  );
}