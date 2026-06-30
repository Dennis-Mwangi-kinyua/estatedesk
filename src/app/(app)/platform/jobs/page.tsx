import { CronJobStatus, NotificationChannel, NotificationType, Prisma } from "@prisma/client";
import { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import { getIntegrationReadinessReport } from "@/lib/integrations";
import { requirePlatformRole } from "@/lib/permissions/guards";
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
} from "../_components/control-plane";
import {
  queueKraRetryAction,
  retryAllFailedNotificationsAction,
  retryFailedNotificationAction,
  runNotificationsJobAction,
  runRetentionJobAction,
} from "./actions";
import { JobActionButton } from "./job-action-controls";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;

type SearchParams = Promise<{
  q?: string;
  jobStatus?: string;
  pageSize?: string;
  queuedPage?: string;
  failedPage?: string;
  kraPage?: string;
  runsPage?: string;
}>;

function formatAge(value: Date | null | undefined) {
  if (!value) return "-";

  const minutes = Math.max(0, Math.floor((Date.now() - value.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;

  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function readProviderError(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "-";
  const error = value.error;
  return typeof error === "string" && error.trim() ? error : "-";
}

function getPageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function getPageSize(value?: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(parsed), 100);
}

function formatJson(value: Prisma.JsonValue | null | undefined) {
  if (value == null) return "-";
  return JSON.stringify(value, null, 2);
}

function buildReturnTo(params: URLSearchParams) {
  const query = params.toString();
  return query ? `/platform/jobs?${query}` : "/platform/jobs";
}

function pagerHref(params: URLSearchParams, pageKey: string, page: number) {
  const next = new URLSearchParams(params.toString());
  next.set(pageKey, String(Math.max(1, page)));
  return `/platform/jobs?${next.toString()}`;
}

function buildNotificationWhere(status: "QUEUED" | "FAILED", q: string): Prisma.NotificationWhereInput {
  const where: Prisma.NotificationWhereInput = { status };
  if (!q) return where;
  const normalized = q.trim().toUpperCase().replaceAll(" ", "_");
  const matchedType = Object.values(NotificationType).find((value) => value === normalized);
  const matchedChannel = Object.values(NotificationChannel).find((value) => value === normalized);
  const or: Prisma.NotificationWhereInput[] = [
    { title: { contains: q, mode: "insensitive" } },
    { org: { name: { contains: q, mode: "insensitive" } } },
    { tenant: { fullName: { contains: q, mode: "insensitive" } } },
    { user: { fullName: { contains: q, mode: "insensitive" } } },
  ];

  if (matchedType) or.push({ type: matchedType });
  if (matchedChannel) or.push({ channel: matchedChannel });

  where.OR = or;
  return where;
}

function buildKraWhere(q: string): Prisma.KraSubmissionAttemptWhereInput {
  const where: Prisma.KraSubmissionAttemptWhereInput = { outcome: "RETRYABLE" };
  if (!q) return where;

  where.rentalReturn = {
    OR: [
      { period: { contains: q, mode: "insensitive" } },
      { filingKey: { contains: q, mode: "insensitive" } },
      { taxpayerPin: { contains: q, mode: "insensitive" } },
      { org: { name: { contains: q, mode: "insensitive" } } },
      { property: { name: { contains: q, mode: "insensitive" } } },
    ],
  };
  return where;
}

function buildRunWhere(q: string, status: string): Prisma.CronJobRunWhereInput {
  const where: Prisma.CronJobRunWhereInput = {};
  const matchedStatus = Object.values(CronJobStatus).find((value) => value === status);
  if (matchedStatus) where.status = matchedStatus;
  if (!q) return where;

  where.OR = [
    { jobName: { contains: q, mode: "insensitive" } },
    { endpoint: { contains: q, mode: "insensitive" } },
    { triggerSource: { contains: q, mode: "insensitive" } },
    { error: { contains: q, mode: "insensitive" } },
    { actor: { fullName: { contains: q, mode: "insensitive" } } },
  ];
  return where;
}

async function getJobsPageData(input: {
  q: string;
  jobStatus: string;
  pageSize: number;
  queuedPage: number;
  failedPage: number;
  kraPage: number;
  runsPage: number;
}) {
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const queuedWhere = buildNotificationWhere("QUEUED", input.q);
  const failedWhere = buildNotificationWhere("FAILED", input.q);
  const kraWhere = buildKraWhere(input.q);
  const runWhere = buildRunWhere(input.q, input.jobStatus);
  const queuedSkip = (input.queuedPage - 1) * input.pageSize;
  const failedSkip = (input.failedPage - 1) * input.pageSize;
  const kraSkip = (input.kraPage - 1) * input.pageSize;
  const runsSkip = (input.runsPage - 1) * input.pageSize;

  return Promise.all([
    prisma.notification.count({ where: { status: "QUEUED" } }),
    prisma.notification.count({ where: { status: "FAILED" } }),
    prisma.notification.findFirst({
      where: { status: "SENT" },
      orderBy: { sentAt: "desc" },
      select: { sentAt: true },
    }),
    prisma.notification.findFirst({
      where: { status: "QUEUED" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.notification.findFirst({
      where: { status: "FAILED" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.notification.count({
      where: { status: "QUEUED", createdAt: { lte: fifteenMinutesAgo } },
    }),
    prisma.notification.count({
      where: { status: "QUEUED", createdAt: { lte: hourAgo } },
    }),
    prisma.notification.count({ where: queuedWhere }),
    prisma.notification.findMany({
      where: queuedWhere,
      orderBy: { createdAt: "asc" },
      skip: queuedSkip,
      take: input.pageSize,
      select: {
        id: true,
        type: true,
        channel: true,
        title: true,
        status: true,
        createdAt: true,
        org: { select: { name: true } },
        tenant: { select: { fullName: true } },
        user: { select: { fullName: true } },
      },
    }),
    prisma.notification.count({ where: failedWhere }),
    prisma.notification.findMany({
      where: failedWhere,
      orderBy: { createdAt: "desc" },
      skip: failedSkip,
      take: input.pageSize,
      select: {
        id: true,
        type: true,
        channel: true,
        title: true,
        status: true,
        createdAt: true,
        providerResponse: true,
        org: { select: { name: true } },
        tenant: { select: { fullName: true } },
        user: { select: { fullName: true } },
      },
    }),
    prisma.kraSubmissionAttempt.count({ where: { outcome: "RETRYABLE" } }),
    prisma.kraSubmissionAttempt.count({ where: kraWhere }),
    prisma.kraSubmissionAttempt.findMany({
      where: kraWhere,
      orderBy: { attemptedAt: "desc" },
      skip: kraSkip,
      take: input.pageSize,
      select: {
        id: true,
        channel: true,
        httpStatus: true,
        errorMessage: true,
        attemptedAt: true,
        rentalReturn: {
          select: {
            period: true,
            filingKey: true,
            status: true,
            org: { select: { name: true, slug: true } },
            property: { select: { name: true } },
          },
        },
      },
    }),
    prisma.cronJobRun.count({ where: runWhere }),
    prisma.cronJobRun.findMany({
      where: runWhere,
      orderBy: { startedAt: "desc" },
      skip: runsSkip,
      take: input.pageSize,
      select: {
        id: true,
        jobName: true,
        endpoint: true,
        triggerSource: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        durationMs: true,
        processedCount: true,
        successCount: true,
        failedCount: true,
        error: true,
        metadata: true,
        actor: { select: { fullName: true } },
      },
    }),
  ]);
}

function MobileField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">{children}</div>
    </div>
  );
}

function MobileEmpty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
      {label}
    </div>
  );
}

function HiddenReturnTo({ value }: { value: string }) {
  return <input type="hidden" name="returnTo" value={value} />;
}

function SectionPager({
  page,
  pageSize,
  total,
  pageKey,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  pageKey: string;
  params: URLSearchParams;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {formatNumber(from)}-{formatNumber(to)} of {formatNumber(total)}
      </p>
      <div className="flex items-center gap-2">
        <a
          href={pagerHref(params, pageKey, page - 1)}
          aria-disabled={page <= 1}
          className={`rounded-lg border border-slate-200 px-3 py-2 font-medium dark:border-white/10 ${
            page <= 1
              ? "pointer-events-none bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-600"
              : "bg-white text-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100"
          }`}
        >
          Previous
        </a>
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-white/10 dark:bg-slate-900">
          {page} / {totalPages}
        </span>
        <a
          href={pagerHref(params, pageKey, page + 1)}
          aria-disabled={page >= totalPages}
          className={`rounded-lg border border-slate-200 px-3 py-2 font-medium dark:border-white/10 ${
            page >= totalPages
              ? "pointer-events-none bg-slate-50 text-slate-300 dark:bg-slate-900 dark:text-slate-600"
              : "bg-white text-slate-800 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100"
          }`}
        >
          Next
        </a>
      </div>
    </div>
  );
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const resolved = await searchParams;
  const q = resolved.q?.trim() ?? "";
  const jobStatus = resolved.jobStatus?.trim() ?? "";
  const pageSize = getPageSize(resolved.pageSize);
  const queuedPage = getPageNumber(resolved.queuedPage);
  const failedPage = getPageNumber(resolved.failedPage);
  const kraPage = getPageNumber(resolved.kraPage);
  const runsPage = getPageNumber(resolved.runsPage);
  const queryParams = new URLSearchParams();

  if (q) queryParams.set("q", q);
  if (jobStatus) queryParams.set("jobStatus", jobStatus);
  if (pageSize !== DEFAULT_PAGE_SIZE) queryParams.set("pageSize", String(pageSize));
  if (queuedPage > 1) queryParams.set("queuedPage", String(queuedPage));
  if (failedPage > 1) queryParams.set("failedPage", String(failedPage));
  if (kraPage > 1) queryParams.set("kraPage", String(kraPage));
  if (runsPage > 1) queryParams.set("runsPage", String(runsPage));

  const returnTo = buildReturnTo(queryParams);
  const [
    queued,
    failed,
    latestSent,
    oldestQueued,
    oldestFailed,
    queuedOver15m,
    queuedOver1h,
    queuedTotal,
    queuedNotifications,
    failedTotal,
    failedNotifications,
    retryableKra,
    retryableKraTotal,
    retryableKraAttempts,
    jobRunsTotal,
    jobRuns,
  ] = await getJobsPageData({
    q,
    jobStatus,
    pageSize,
    queuedPage,
    failedPage,
    kraPage,
    runsPage,
  });
  const integrationReadiness = getIntegrationReadinessReport();

  return (
    <div className="space-y-6">
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

      <Surface title="Job endpoints" description="Manual runs are guarded by platform role checks and written to the audit log. Scheduled HTTP runs require CRON_SECRET in production.">
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
            <p className="font-semibold text-slate-950 dark:text-white">POST /api/cron/notifications</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Queues due-payment reminders, then dispatches queued notifications.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
            <p className="font-semibold text-slate-950 dark:text-white">POST /api/cron/retention</p>
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
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{run.endpoint ?? "-"}</p>
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
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{run.endpoint ?? "-"}</p>
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

      <Surface title="Queued notification backlog">
        <div className="grid gap-3 p-4 md:hidden">
          {queuedNotifications.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 dark:text-white">{item.org.name}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.title}</p>
                </div>
                <Badge tone={toneForStatus(item.status)}>{item.channel}</Badge>
              </div>
              <div className="mt-4 grid gap-3">
                <MobileField label="Recipient">{item.tenant?.fullName ?? item.user?.fullName ?? "-"}</MobileField>
                <MobileField label="Type">{labelize(item.type)}</MobileField>
                <div className="grid grid-cols-2 gap-3">
                  <MobileField label="Age">{formatAge(item.createdAt)}</MobileField>
                  <MobileField label="Created">{formatDateTime(item.createdAt)}</MobileField>
                </div>
              </div>
            </article>
          ))}
          {queuedNotifications.length === 0 ? <MobileEmpty label="No queued notifications found." /> : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {queuedNotifications.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 dark:border-white/10">
                  <td className="px-4 py-3 font-medium">{item.org.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.tenant?.fullName ?? item.user?.fullName ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{labelize(item.type)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.channel}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.title}</td>
                  <td className="px-4 py-3 font-medium">{formatAge(item.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(item.createdAt)}</td>
                </tr>
              ))}
              {queuedNotifications.length === 0 ? <EmptyRow colSpan={7} label="No queued notifications found." /> : null}
            </tbody>
          </table>
        </div>
        <SectionPager page={queuedPage} pageSize={pageSize} total={queuedTotal} pageKey="queuedPage" params={queryParams} />
      </Surface>

      <Surface
        title="Failed notification queue"
        description="Failed records can be requeued for the next notification job run after the cause is corrected."
      >
        <div className="border-b border-slate-100 p-4 dark:border-white/10">
          <form action={retryAllFailedNotificationsAction}>
            <HiddenReturnTo value={returnTo} />
            <JobActionButton
              variant="danger"
              pendingLabel="Requeueing..."
              confirmMessage={`Retry all ${formatNumber(failed)} failed notifications?`}
            >
              Retry all failed
            </JobActionButton>
          </form>
        </div>
        <div className="grid gap-3 p-4 md:hidden">
          {failedNotifications.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 dark:text-white">{item.org.name}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.title}</p>
                </div>
                <Badge tone={toneForStatus(item.status)}>{item.channel}</Badge>
              </div>
              <div className="mt-4 grid gap-3">
                <MobileField label="Recipient">{item.tenant?.fullName ?? item.user?.fullName ?? "-"}</MobileField>
                <MobileField label="Type">{labelize(item.type)}</MobileField>
                <MobileField label="Error">{readProviderError(item.providerResponse)}</MobileField>
                <div className="flex items-center justify-between gap-3">
                  <MobileField label="Age">{formatAge(item.createdAt)}</MobileField>
                  <form action={retryFailedNotificationAction}>
                    <HiddenReturnTo value={returnTo} />
                    <input type="hidden" name="notificationId" value={item.id} />
                    <JobActionButton variant="secondary" pendingLabel="Retrying...">
                      Retry
                    </JobActionButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
          {failedNotifications.length === 0 ? <MobileEmpty label="No failed notifications found." /> : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Recipient</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Error</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {failedNotifications.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 dark:border-white/10">
                  <td className="px-4 py-3 font-medium">{item.org.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.tenant?.fullName ?? item.user?.fullName ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{labelize(item.type)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.channel}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.title}</td>
                  <td className="max-w-md px-4 py-3 text-slate-600 dark:text-slate-300">{readProviderError(item.providerResponse)}</td>
                  <td className="px-4 py-3 font-medium">{formatAge(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <form action={retryFailedNotificationAction}>
                      <HiddenReturnTo value={returnTo} />
                      <input type="hidden" name="notificationId" value={item.id} />
                      <JobActionButton variant="secondary" pendingLabel="Retrying...">
                        Retry
                      </JobActionButton>
                    </form>
                  </td>
                </tr>
              ))}
              {failedNotifications.length === 0 ? <EmptyRow colSpan={8} label="No failed notifications found." /> : null}
            </tbody>
          </table>
        </div>
        <SectionPager page={failedPage} pageSize={pageSize} total={failedTotal} pageKey="failedPage" params={queryParams} />
      </Surface>

      <Surface title="KRA retryable attempts">
        <div className="grid gap-3 p-4 md:hidden">
          {retryableKraAttempts.map((attempt) => (
            <article key={attempt.id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950 dark:text-white">{attempt.rentalReturn.org.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{attempt.rentalReturn.filingKey}</p>
                </div>
                <Badge tone={toneForStatus(attempt.rentalReturn.status)}>{attempt.rentalReturn.status}</Badge>
              </div>
              <div className="mt-4 grid gap-3">
                <MobileField label="Return">{attempt.rentalReturn.period}</MobileField>
                <MobileField label="Property">{attempt.rentalReturn.property?.name ?? "-"}</MobileField>
                <div className="grid grid-cols-2 gap-3">
                  <MobileField label="Channel">{labelize(attempt.channel)}</MobileField>
                  <MobileField label="HTTP">{attempt.httpStatus ?? "-"}</MobileField>
                </div>
                <MobileField label="Attempted">{formatDateTime(attempt.attemptedAt)}</MobileField>
                {attempt.errorMessage ? <MobileField label="Error">{attempt.errorMessage}</MobileField> : null}
                <form action={queueKraRetryAction}>
                  <HiddenReturnTo value={returnTo} />
                  <input type="hidden" name="attemptId" value={attempt.id} />
                  <JobActionButton variant="secondary" pendingLabel="Queueing...">
                    Queue retry
                  </JobActionButton>
                </form>
              </div>
            </article>
          ))}
          {retryableKraAttempts.length === 0 ? <MobileEmpty label="No retryable KRA attempts found." /> : null}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Return</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">HTTP</th>
                <th className="px-4 py-3 font-medium">Attempted</th>
                <th className="px-4 py-3 font-medium">Error</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {retryableKraAttempts.map((attempt) => (
                <tr key={attempt.id} className="border-t border-slate-100 dark:border-white/10">
                  <td className="px-4 py-3 font-medium">{attempt.rentalReturn.org.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    <p>{attempt.rentalReturn.period}</p>
                    <p className="mt-1 text-xs text-slate-500">{attempt.rentalReturn.filingKey}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{attempt.rentalReturn.property?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{labelize(attempt.channel)}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{attempt.httpStatus ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDateTime(attempt.attemptedAt)}</td>
                  <td className="max-w-md px-4 py-3 text-slate-600 dark:text-slate-300">{attempt.errorMessage ?? "-"}</td>
                  <td className="px-4 py-3">
                    <form action={queueKraRetryAction}>
                      <HiddenReturnTo value={returnTo} />
                      <input type="hidden" name="attemptId" value={attempt.id} />
                      <JobActionButton variant="secondary" pendingLabel="Queueing...">
                        Queue retry
                      </JobActionButton>
                    </form>
                  </td>
                </tr>
              ))}
              {retryableKraAttempts.length === 0 ? <EmptyRow colSpan={8} label="No retryable KRA attempts found." /> : null}
            </tbody>
          </table>
        </div>
        <SectionPager page={kraPage} pageSize={pageSize} total={retryableKraTotal} pageKey="kraPage" params={queryParams} />
      </Surface>
    </div>
  );
}
