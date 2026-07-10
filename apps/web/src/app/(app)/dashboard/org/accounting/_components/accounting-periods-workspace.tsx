import { CalendarRange, Lock, Unlock } from "lucide-react";
import {
  generatePeriodsAction,
  postPeriodCloseEntriesAction,
  runYearEndCloseAction,
  updatePeriodStatusAction,
} from "../period-actions";
import type { getPeriodsPageData } from "../_lib/period-queries";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  fieldClassName,
  formatDate,
  labelClassName,
} from "../_lib/helpers";
import { panelShellClassName, SectionHeader, StatCard } from "./accounting-ui";

type PeriodsPageData = Awaited<ReturnType<typeof getPeriodsPageData>>;

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200",
  LOCKED: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
  CLOSED: "bg-muted text-muted-foreground",
};

export function AccountingPeriodsWorkspace({
  data,
  message,
}: {
  data: PeriodsPageData;
  message?: string;
}) {
  const { periods, currentPeriod, checklist, closedPeriodIds, fiscalYear, yearEndPreview } =
    data;

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      {checklist && currentPeriod ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Draft journals" value={String(checklist.draftJournals)} compact />
          <StatCard label="Unposted payments" value={String(checklist.unpostedPayments)} compact />
          <StatCard label="Open bills" value={String(checklist.openBills)} compact />
          <StatCard
            label="Close readiness"
            value={checklist.canClose ? "Ready" : "Blocked"}
            compact
            highlight={checklist.canClose}
          />
        </section>
      ) : null}

      <section className={panelShellClassName}>
        <SectionHeader
          title="Year-end close"
          description="Lock all fiscal-year periods, post closing entries to retained earnings, close the year, and open next-year periods."
        />
        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Periods in year"
              value={String(yearEndPreview.periods.length)}
              compact
            />
            <StatCard
              label="Pending close"
              value={String(yearEndPreview.pendingClose)}
              compact
            />
            <StatCard
              label="Closing entries needed"
              value={String(yearEndPreview.pendingClosingEntries)}
              compact
              highlight={yearEndPreview.pendingClosingEntries > 0}
            />
          </div>

          {yearEndPreview.blockers.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
              {yearEndPreview.blockers.join(" · ")}
            </div>
          ) : null}

          <form action={runYearEndCloseAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className={labelClassName}>
              Fiscal year
              <input
                name="year"
                type="number"
                defaultValue={fiscalYear}
                className={fieldClassName}
              />
            </label>
            <label className="flex items-center gap-2 pb-3 text-sm text-foreground">
              <input type="checkbox" name="openNextYear" defaultChecked />
              Open next fiscal year periods
            </label>
            <button
              type="submit"
              className={buttonPrimaryClassName}
              disabled={!yearEndPreview.canRun}
            >
              Run year-end close
            </button>
          </form>
        </div>
      </section>

      <section className={panelShellClassName}>
        <SectionHeader
          icon={CalendarRange}
          title="Fiscal periods"
          description="Generate monthly periods from your fiscal year start, then lock or close them when ready."
          action={
            <form action={generatePeriodsAction} className="flex items-end gap-2">
              <label className={labelClassName}>
                Year
                <input
                  name="year"
                  type="number"
                  defaultValue={fiscalYear}
                  className={fieldClassName}
                />
              </label>
              <button type="submit" className={buttonPrimaryClassName}>
                Generate periods
              </button>
            </form>
          }
        />

        <div className="divide-y divide-border">
          {periods.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
              No periods yet. Generate a fiscal year to get started.
            </p>
          ) : (
            periods.map((period) => (
              <div
                key={period.id}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{period.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[period.status]}`}
                    >
                      {period.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(period.startsAt)} – {formatDate(period.endsAt)}
                    {period.closedAt ? ` · Closed ${formatDate(period.closedAt)}` : ""}
                  </p>
                  {period.closeNotes ? (
                    <p className="mt-1 text-xs text-muted-foreground">{period.closeNotes}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {period.status === "OPEN" ? (
                    <>
                      <form action={updatePeriodStatusAction}>
                        <input type="hidden" name="periodId" value={period.id} />
                        <input type="hidden" name="action" value="lock" />
                        <button type="submit" className={buttonSecondaryClassName}>
                          <Lock className="mr-1 inline h-3.5 w-3.5" />
                          Lock
                        </button>
                      </form>
                      <form action={updatePeriodStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="periodId" value={period.id} />
                        <input type="hidden" name="action" value="close" />
                        <input
                          name="closeNotes"
                          placeholder="Close notes (optional)"
                          className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
                        />
                        <button type="submit" className={buttonPrimaryClassName}>
                          Close period
                        </button>
                      </form>
                    </>
                  ) : null}
                  {period.status === "LOCKED" ? (
                    <form action={updatePeriodStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="periodId" value={period.id} />
                      <input type="hidden" name="action" value="close" />
                      <input
                        name="closeNotes"
                        placeholder="Close notes (optional)"
                        className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
                      />
                      <button type="submit" className={buttonPrimaryClassName}>
                        Close period
                      </button>
                    </form>
                  ) : null}
                  {period.status !== "OPEN" && !closedPeriodIds.has(period.id) ? (
                    <form action={postPeriodCloseEntriesAction}>
                      <input type="hidden" name="periodId" value={period.id} />
                      <button type="submit" className={buttonPrimaryClassName}>
                        Post closing entries
                      </button>
                    </form>
                  ) : null}
                  {closedPeriodIds.has(period.id) ? (
                    <span className="inline-flex h-11 items-center rounded-2xl border border-border px-3 text-xs font-semibold text-muted-foreground">
                      Closing entries posted
                    </span>
                  ) : null}
                  {period.status !== "OPEN" ? (
                    <form action={updatePeriodStatusAction}>
                      <input type="hidden" name="periodId" value={period.id} />
                      <input type="hidden" name="action" value="reopen" />
                      <button type="submit" className={buttonSecondaryClassName}>
                        <Unlock className="mr-1 inline h-3.5 w-3.5" />
                        Reopen
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}