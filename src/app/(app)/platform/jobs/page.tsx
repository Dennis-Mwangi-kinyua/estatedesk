import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
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
  retryAllFailedNotificationsAction,
  retryFailedNotificationAction,
  runNotificationsJobAction,
  runRetentionJobAction,
} from "./actions";

export const dynamic = "force-dynamic";

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

const getJobsPageData = unstable_cache(
  async () => {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

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
      prisma.notification.findMany({
        where: { status: "QUEUED" },
        orderBy: { createdAt: "asc" },
        take: 25,
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
      prisma.notification.findMany({
        where: { status: "FAILED" },
        orderBy: { createdAt: "desc" },
        take: 40,
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
      prisma.kraSubmissionAttempt.findMany({
        where: { outcome: "RETRYABLE" },
        orderBy: { attemptedAt: "desc" },
        take: 25,
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
      prisma.cronJobRun.findMany({
        orderBy: { startedAt: "desc" },
        take: 20,
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
          actor: { select: { fullName: true } },
        },
      }),
    ]);
  },
  ["platform-jobs-page-data"],
  {
    revalidate: 15,
    tags: ["platform-jobs"],
  },
);

function ActionButton({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
}) {
  const classes =
    variant === "danger"
      ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
      : variant === "secondary"
        ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
        : "border-slate-950 bg-slate-950 text-white hover:bg-slate-800";

  return (
    <button
      type="submit"
      className={`inline-flex min-h-11 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition sm:min-h-9 ${classes}`}
    >
      {children}
    </button>
  );
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

export default async function JobsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const [
    queued,
    failed,
    latestSent,
    oldestQueued,
    oldestFailed,
    queuedOver15m,
    queuedOver1h,
    queuedNotifications,
    failedNotifications,
    retryableKra,
    retryableKraAttempts,
    jobRuns,
  ] = await getJobsPageData();
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
              <ActionButton>Run notifications</ActionButton>
            </form>
            <form action={runRetentionJobAction}>
              <ActionButton variant="secondary">Run retention</ActionButton>
            </form>
          </div>
        }
      />

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
                <tr key={run.id} className="border-t border-slate-100 dark:border-white/10">
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
              ))}
              {jobRuns.length === 0 ? <EmptyRow colSpan={9} label="No job runs recorded yet." /> : null}
            </tbody>
          </table>
        </div>
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
      </Surface>

      <Surface
        title="Failed notification queue"
        description="Failed records can be requeued for the next notification job run after the cause is corrected."
      >
        <div className="border-b border-slate-100 p-4 dark:border-white/10">
          <form action={retryAllFailedNotificationsAction}>
            <ActionButton variant="danger">Retry all failed</ActionButton>
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
                    <input type="hidden" name="notificationId" value={item.id} />
                    <ActionButton variant="secondary">Retry</ActionButton>
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
                      <input type="hidden" name="notificationId" value={item.id} />
                      <ActionButton variant="secondary">Retry</ActionButton>
                    </form>
                  </td>
                </tr>
              ))}
              {failedNotifications.length === 0 ? <EmptyRow colSpan={8} label="No failed notifications found." /> : null}
            </tbody>
          </table>
        </div>
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
                </tr>
              ))}
              {retryableKraAttempts.length === 0 ? <EmptyRow colSpan={7} label="No retryable KRA attempts found." /> : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
