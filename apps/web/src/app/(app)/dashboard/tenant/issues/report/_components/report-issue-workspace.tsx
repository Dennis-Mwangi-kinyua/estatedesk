import Link from "next/link";
import { AlertCircle, ChevronLeft, Send, Wrench } from "lucide-react";
import { reportIssueAction } from "../_lib/actions";
import { unitLabel } from "../_lib/helpers";
import type { ReportIssuePageData } from "../_lib/types";

export function ReportIssueWorkspace({ data }: { data: ReportIssuePageData }) {
  const { leaseUnits, errorMessage, sharedTitle, sharedDescription } = data;

  return (
    <div className="ed-theme-page ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        <div className="space-y-4 sm:space-y-6">
          <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6 lg:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <Link
                  href="/dashboard/tenant/issues"
                  className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-neutral-800"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back to issues
                </Link>

                <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Tenant Support
                </p>
                <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
                  Report Issue
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Submit a maintenance or support issue for your current unit so
                  management can review and track it.
                </p>
              </div>

              <div className="ed-theme-muted-panel rounded-[24px] px-4 py-4 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Available Units
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {leaseUnits.length}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select the affected unit below
                </p>
              </div>
            </div>
          </section>

          {errorMessage ? (
            <section className="rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            </section>
          ) : null}

          <form action={reportIssueAction} className="space-y-4 sm:space-y-6">
            <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
              <div className="mb-4">
                <h2 className="text-[20px] font-semibold tracking-tight text-foreground">
                  Issue Details
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Give a clear summary and description so the team can help faster.
                </p>
              </div>

              <div className="grid gap-4">
                <div>
                  <label
                    htmlFor="unitId"
                    className="mb-2 block text-sm font-medium text-foreground/80"
                  >
                    Unit
                  </label>
                  <select
                    id="unitId"
                    name="unitId"
                    required
                    defaultValue={leaseUnits[0]?.id ?? ""}
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-neutral-400"
                  >
                    {leaseUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unitLabel(unit)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-medium text-foreground/80"
                  >
                    Issue title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    maxLength={120}
                    defaultValue={sharedTitle}
                    placeholder="e.g. Bathroom sink leaking"
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-neutral-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="priority"
                    className="mb-2 block text-sm font-medium text-foreground/80"
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    defaultValue="MEDIUM"
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-neutral-400"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-foreground/80"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={6}
                    maxLength={2000}
                    defaultValue={sharedDescription}
                    placeholder="Describe the problem, where it is, when it started, and anything that makes it worse or urgent."
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-neutral-400"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] ed-theme-card border border-border bg-card p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                  <Wrench className="h-4 w-4 text-foreground/80" />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold tracking-tight text-foreground">
                    Before you submit
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Include the exact room or area affected, what is happening,
                    and how urgent it is. This helps management assign the issue
                    correctly.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/tenant/issues"
                  className="inline-flex items-center justify-center rounded-[16px] border border-neutral-300 bg-card px-4 py-3 text-sm font-medium text-foreground/80"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit Issue
                </button>
              </div>
            </section>
          </form>
        </div>
      </div>
    </div>
  );
}