import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { CheckCircle2, ClipboardList, XCircle } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  approveIssueResolutionReportAction,
  rejectIssueResolutionReportAction,
} from "@/app/(app)/dashboard/org/issues/actions";
import {
  formatDate,
  getIssueUnitLabel,
  getPriorityClasses,
} from "@/app/(app)/dashboard/org/issues/_lib/helpers";
import type { getResolutionReportsQueueData } from "../_lib/queries";

const panelShellClassName =
  "overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm";

const fieldClassName =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40";

const primaryButtonClassName =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700";

const secondaryButtonClassName =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30";

type ResolutionReportsQueueData = Awaited<
  ReturnType<typeof getResolutionReportsQueueData>
>;

export function ResolutionReportsWorkspace({
  data,
  orgRole,
}: {
  data: ResolutionReportsQueueData;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className={panelShellClassName}>
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <ClipboardList className="h-3.5 w-3.5" />
                Maintenance closeout
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Resolution report queue
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                Review caretaker completion reports, approve work for tenant
                confirmation, or return tickets for follow-up.
              </p>
              <InAppGuideHint topic="issues" workspace="org" orgRole={orgRole} />
            </div>
            <Link
              href="/dashboard/org/issues"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              Open issues desk
            </Link>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-muted/10 px-4 py-4 sm:max-w-xs">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Pending review
            </p>
            <p
              className={`mt-2 text-2xl font-semibold ${
                data.pendingCount > 0
                  ? "text-amber-700 dark:text-amber-200"
                  : "text-foreground"
              }`}
            >
              {data.pendingCount}
            </p>
          </div>
        </div>
      </section>

      <section className={panelShellClassName}>
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-foreground">Submitted reports</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Oldest submissions appear first so nothing waits behind newer work.
          </p>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {data.reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-5 py-10 text-center">
              <p className="text-sm font-semibold text-foreground">
                Nothing waiting for review
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Caretaker completion reports will appear here once submitted.
              </p>
            </div>
          ) : (
            data.reports.map((report) => {
              const issue = report.issue;
              const unitLabel = getIssueUnitLabel({
                property: issue.property,
                unit: issue.unit,
              });

              return (
                <article
                  key={report.id}
                  className="rounded-2xl border border-border bg-muted/10 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getPriorityClasses(issue.priority)}`}
                        >
                          {issue.priority}
                        </span>
                        <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                          {unitLabel}
                        </span>
                      </div>

                      <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">
                        {issue.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {report.caretaker.fullName ??
                          report.caretaker.email ??
                          "Caretaker"}{" "}
                        submitted on {formatDate(report.submittedAt)}
                        {issue.assignedTo
                          ? ` • Assigned to ${issue.assignedTo.fullName ?? issue.assignedTo.email}`
                          : ""}
                      </p>

                      <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Work done
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground">
                          {report.workSummary}
                        </p>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {report.materialsUsed ? (
                          <div className="rounded-2xl border border-border bg-background p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Materials
                            </p>
                            <p className="mt-2 text-sm leading-6 text-foreground">
                              {report.materialsUsed}
                            </p>
                          </div>
                        ) : null}
                        {report.tenantInstructions ? (
                          <div className="rounded-2xl border border-border bg-background p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Tenant notes
                            </p>
                            <p className="mt-2 text-sm leading-6 text-foreground">
                              {report.tenantInstructions}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      <DeferredLink
                        href={`/dashboard/org/issues/${issue.id}`}
                        className="mt-4 inline-flex text-sm font-medium text-primary"
                      >
                        Open issue detail
                      </DeferredLink>
                    </div>

                    <div className="w-full space-y-3 lg:max-w-sm">
                      <form action={approveIssueResolutionReportAction}>
                        <input type="hidden" name="reportId" value={report.id} />
                        <input type="hidden" name="issueId" value={issue.id} />
                        <input type="hidden" name="returnTo" value="queue" />
                        <label className="block">
                          <span className="sr-only">Office note for tenant</span>
                          <textarea
                            name="officeNotes"
                            rows={2}
                            placeholder="Office note for tenant (optional)"
                            className={`${fieldClassName} min-h-[4.5rem] resize-y`}
                          />
                        </label>
                        <button
                          type="submit"
                          className={`${primaryButtonClassName} mt-3`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve and send to tenant
                        </button>
                      </form>

                      <form action={rejectIssueResolutionReportAction} className="space-y-3">
                        <input type="hidden" name="reportId" value={report.id} />
                        <input type="hidden" name="issueId" value={issue.id} />
                        <input type="hidden" name="returnTo" value="queue" />
                        <label className="block">
                          <span className="sr-only">Return notes</span>
                          <textarea
                            name="officeNotes"
                            rows={3}
                            placeholder="What should the caretaker fix?"
                            className={`${fieldClassName} min-h-[5.5rem] resize-y`}
                          />
                        </label>
                        <button type="submit" className={secondaryButtonClassName}>
                          <XCircle className="h-4 w-4" />
                          Return for more work
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}