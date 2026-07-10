import { Fragment } from "react";
import type { IntegrationReadinessReport } from "@/lib/integrations";
import {
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
  labelize,
  toneForStatus,
} from "../../_components/control-plane";
import {
  queueKraRetryAction,
  retryAllFailedNotificationsAction,
  retryFailedNotificationAction,
  runNotificationsJobAction,
  runRetentionJobAction,
} from "../actions";
import { JobActionButton } from "../job-action-controls";
import type { JobsPageData } from "../_lib/queries";
import type { JobsPageInput } from "../_lib/types";
import { DEFAULT_PAGE_SIZE } from "../_lib/types";
import { formatAge, formatJson, readProviderError } from "../_lib/helpers";
import { HiddenReturnTo, MobileEmpty, MobileField, SectionPager } from "./jobs-ui";

export type JobsWorkspaceProps = {
  data: JobsPageData;
  filters: JobsPageInput;
  queryParams: URLSearchParams;
  returnTo: string;
  integrationReadiness: IntegrationReadinessReport;
};

export function JobsOverviewSection({
  data,
  filters,
  queryParams,
  returnTo,
  integrationReadiness,
}: JobsWorkspaceProps) {
  const {
    queued,
    failed,
    latestSent,
    oldestQueued,
    oldestFailed,
    queuedOver15m,
    queuedOver1h,
    jobRunsTotal,
    jobRuns,
    retryableKra,
  } = data;
  const { q, jobStatus, pageSize, runsPage } = filters;

  return (
    <>

      <PageHeader
        eyebrow="Background jobs"
        title="Cron and queue monitor"
        description="Operational view of cron runs, notification dispatch, retry queues, KRA attempts, and delivery provider readiness."
        action={
          <div className="flex flex-wrap gap-2">
            <form action={runNotificationsJobAction}>
              <HiddenReturnTo value={returnTo} />
              <JobActionButton pendingLabel="Running...">Run notifications</JobActionButton>
            </form>
            <form action={runRetentionJobAction}>
              <HiddenReturnTo value={returnTo} />
              <JobActionButton variant="secondary" pendingLabel="Running...">
                Run retention
              </JobActionButton>
            </form>
          </div>
        }
      />

      <Surface title="Filters">
        <form className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_180px_140px_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search jobs, organizations, recipients, KRA filing keys"
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-slate-900"
          />
          <select
            name="jobStatus"
            defaultValue={jobStatus}
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-slate-900"
          >
            <option value="">All run statuses</option>
            <option value="RUNNING">Running</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
          </select>
          <select
            name="pageSize"
            defaultValue={String(pageSize)}
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-slate-900"
          >
            <option value="10">10 rows</option>
            <option value="20">20 rows</option>
            <option value="50">50 rows</option>
            <option value="100">100 rows</option>
          </select>
          <button className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950">
            Apply
          </button>
        </form>
      </Surface>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Queued notifications" value={formatNumber(queued)} note={`Oldest ${formatAge(oldestQueued?.createdAt)}`} />
        <StatCard label="Failed notifications" value={formatNumber(failed)} note={`Oldest ${formatAge(oldestFailed?.createdAt)}`} />
        <StatCard label="Queued over 15m" value={formatNumber(queuedOver15m)} note={`${formatNumber(queuedOver1h)} over 1h`} />
        <StatCard label="Retryable KRA attempts" value={formatNumber(retryableKra)} note={`Last sent ${formatDateTime(latestSent?.sentAt)}`} />
      </section>

      <Surface title="Scheduled jobs" description="Manual runs are guarded by platform role checks and written to the audit log. Scheduled HTTP runs require a production cron secret.">
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
            <p className="font-semibold text-slate-950 dark:text-white">Notification dispatch</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Queues due-payment reminders, then dispatches queued notifications.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
            <p className="font-semibold text-slate-950 dark:text-white">Data retention review</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Builds a report-only retention review and sends a security alert when records need review.
            </p>
          </div>
        </div>
      </Surface>

      <Surface title="Recent job runs">
        <div className="grid gap-3 p-4 md:hidden">
          {jobRuns.map((run) => (
            <article key={run.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 dark:text-white">{labelize(run.jobName)}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{labelize(run.triggerSource)}</p>
                </div>
                <Badge tone={toneForStatus(run.status)}>{run.status}</Badge>
              </div>
              <div className="mt-4 grid gap-3">
                <MobileField label="Trigger">
                  {labelize(run.triggerSource)}
                  {run.actor ? <p className="mt-1 text-xs text-slate-500">{run.actor.fullName}</p> : null}
                </MobileField>
                <div className="grid grid-cols-3 gap-3">
                  <MobileField label="Done">{formatNumber(run.processedCount)}</MobileField>
                  <MobileField label="OK">{formatNumber(run.successCount)}</MobileField>
                  <MobileField label="Failed">{formatNumber(run.failedCount)}</MobileField>
                </div>
                <MobileField label="Started">{formatDateTime(run.startedAt)}</MobileField>
                {run.error ? <MobileField label="Error">{run.error}</MobileField> : null}
                {run.metadata ? (
                  <details className="rounded-lg border border-slate-200 p-3 dark:border-white/10">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      Metadata
                    </summary>
                    <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-300">
                      {formatJson(run.metadata)}
                    </pre>
                  </details>
                ) : null}
              </div>
            </article>
          ))}
          {jobRuns.length === 0 ? <MobileEmpty label="No job runs recorded yet." /> : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Job</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Trigger</th>
                <th className="px-4 py-3 font-medium">Processed</th>
                <th className="px-4 py-3 font-medium">Succeeded</th>
                <th className="px-4 py-3 font-medium">Failed</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Started</th>
                <th className="px-4 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {jobRuns.map((run) => (
                <Fragment key={run.id}>
                  <tr className="border-t border-slate-100 dark:border-white/10">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-950 dark:text-white">{labelize(run.jobName)}</p>
                    </td>
                    <td className="px-4 py-3"><Badge tone={toneForStatus(run.status)}>{run.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {labelize(run.triggerSource)}
                      {run.actor ? <p className="mt-1 text-xs text-slate-500">{run.actor.fullName}</p> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatNumber(run.processedCount)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatNumber(run.successCount)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatNumber(run.failedCount)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{run.durationMs == null ? "-" : `${run.durationMs}ms`}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(run.startedAt)}</td>
                    <td className="max-w-sm px-4 py-3 text-slate-600 dark:text-slate-300">{run.error ?? "-"}</td>
                  </tr>
                  {run.metadata ? (
                    <tr className="border-t border-slate-100 bg-slate-50/60 dark:border-white/10 dark:bg-slate-900/60">
                      <td colSpan={9} className="px-4 py-3">
                        <details>
                          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                            View metadata
                          </summary>
                          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
                            {formatJson(run.metadata)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
              {jobRuns.length === 0 ? <EmptyRow colSpan={9} label="No job runs recorded yet." /> : null}
            </tbody>
          </table>
        </div>
        <SectionPager page={runsPage} pageSize={pageSize} total={jobRunsTotal} pageKey="runsPage" params={queryParams} />
      </Surface>

      <Surface
        title="Integration readiness"
        description="Structural map for approved and pending external providers. Missing keys mean the adapter is not ready for live traffic; pending approval means credentials can be wired once the provider relationship is cleared."
      >
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {integrationReadiness.integrations.map((provider) => (
            <div key={provider.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 dark:text-white">{provider.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    Phase {provider.phase} / {provider.region} / {labelize(provider.category)}
                  </p>
                </div>
                <Badge tone={toneForStatus(provider.status)}>{provider.status}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">
                {provider.localFoundation}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                Next: {provider.nextAction}
              </p>
              {provider.missingEnv.length > 0 ? (
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Missing: {provider.missingEnv.join(", ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Surface>

    </>
  );
}
