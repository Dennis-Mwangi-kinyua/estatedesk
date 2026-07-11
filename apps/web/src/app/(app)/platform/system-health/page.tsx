import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { getProductionReadinessReport } from "@/lib/ops/production-readiness";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  AdminLink,
  Badge,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
  labelize,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

export default async function SystemHealthPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let readiness: Awaited<ReturnType<typeof getProductionReadinessReport>> | null =
    null;
  let readinessError: string | null = null;

  try {
    readiness = await getProductionReadinessReport();
  } catch (error) {
    console.error("[SystemHealthPage] readiness failed", error);
    readinessError =
      "Could not load production readiness (database may be cold). Refresh shortly.";
  }

  const metrics = await retryTransientDatabaseOperation(
    async () => {
      const [
        orgs,
        users,
        queued,
        failed,
        sentToday,
        failedPayments,
        pendingGateway,
        pastDueSubs,
        failedCrons,
        kraErrors,
        latestAudit,
        recentFailedPayments,
      ] = await Promise.all([
        prisma.organization.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.notification.count({ where: { status: "QUEUED" } }),
        prisma.notification.count({ where: { status: "FAILED" } }),
        prisma.notification.count({
          where: { status: "SENT", sentAt: { gte: dayAgo } },
        }),
        prisma.payment.count({ where: { gatewayStatus: "FAILED" } }),
        prisma.payment.count({
          where: {
            gatewayStatus: { in: ["PENDING", "INITIATED"] },
            createdAt: { gte: weekAgo },
          },
        }),
        prisma.subscription.count({ where: { status: "PAST_DUE" } }),
        prisma.cronJobRun.count({
          where: { status: "FAILED", startedAt: { gte: dayAgo } },
        }),
        prisma.kraIntegration.findMany({
          where: { OR: [{ status: "ERROR" }, { lastError: { not: null } }] },
          orderBy: { updatedAt: "desc" },
          take: 8,
          include: { org: { select: { name: true, slug: true } } },
        }),
        prisma.auditLog.findFirst({
          orderBy: { createdAt: "desc" },
          select: {
            createdAt: true,
            action: true,
            org: { select: { name: true } },
          },
        }),
        prisma.payment.findMany({
          where: {
            OR: [
              { gatewayStatus: "FAILED" },
              {
                gatewayStatus: { in: ["PENDING", "INITIATED"] },
                createdAt: { gte: dayAgo },
              },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: {
            id: true,
            amount: true,
            gatewayStatus: true,
            verificationStatus: true,
            method: true,
            createdAt: true,
            externalReference: true,
            org: { select: { name: true, slug: true } },
          },
        }),
      ]);

      return {
        orgs,
        users,
        queued,
        failed,
        sentToday,
        failedPayments,
        pendingGateway,
        pastDueSubs,
        failedCrons,
        kraErrors,
        latestAudit,
        recentFailedPayments,
      };
    },
    { label: "system-health-metrics", attempts: 3, delayMs: 400 },
  ).catch((error) => {
    console.error("[SystemHealthPage] metrics failed", error);
    return null;
  });

  if (!metrics) {
    return (
      <div className="ed-mobile-first space-y-4">
        <PageHeader
          eyebrow="Developer portal"
          title="System health"
          description="Live control-plane health indicators."
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Could not load system health metrics. Refresh after the database warms up.
        </div>
      </div>
    );
  }

  return (
    <div className="ed-mobile-first mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Developer portal"
        title="System health"
        description="Queues, payment gateways, subscriptions, crons, KRA, and production readiness gates."
        action={
          <Link
            href="/platform/billing"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold"
          >
            Billing / upgrades
          </Link>
        }
      />

      {readinessError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          {readinessError}
        </div>
      ) : null}

      {readiness ? (
        <Surface
          title="Production readiness"
          description={
            readiness.readyForSoftLaunch
              ? "Core env is present. Complete operator gates (legal, restore, live payment E2E) before broad commercial scale."
              : "Blocking environment issues remain — fix fails before scale."
          }
        >
          <div className="grid gap-2 border-b border-border p-3 sm:grid-cols-3 sm:p-4">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                Soft-launch env
              </p>
              <p className="mt-1 text-sm font-semibold">
                {readiness.readyForSoftLaunch ? "Ready" : "Not ready"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                Blocking fails
              </p>
              <p className="mt-1 text-sm font-semibold">{readiness.blockingFails}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                Operator gates
              </p>
              <p className="mt-1 text-sm font-semibold">
                {readiness.blockingPending} pending
              </p>
            </div>
          </div>
          <ul className="divide-y divide-border">
            {readiness.checks.map((check) => (
              <li
                key={check.id}
                className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {check.label}
                    {check.blocking ? (
                      <span className="ml-2 text-[10px] font-bold uppercase text-amber-700">
                        launch
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{check.detail}</p>
                </div>
                <Badge
                  tone={
                    check.status === "pass"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : check.status === "warn"
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : "border-red-200 bg-red-50 text-red-800"
                  }
                >
                  {check.status}
                </Badge>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      <section className="ed-keep-cols grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <StatCard label="Organizations" value={formatNumber(metrics.orgs)} />
        <StatCard label="Users" value={formatNumber(metrics.users)} />
        <StatCard label="Queued notifications" value={formatNumber(metrics.queued)} />
        <StatCard label="Failed notifications" value={formatNumber(metrics.failed)} />
        <StatCard label="Sent in 24h" value={formatNumber(metrics.sentToday)} />
        <StatCard label="Failed payments" value={formatNumber(metrics.failedPayments)} />
        <StatCard
          label="Pending gateway (7d)"
          value={formatNumber(metrics.pendingGateway)}
        />
        <StatCard label="Past-due subs" value={formatNumber(metrics.pastDueSubs)} />
        <StatCard label="Failed crons (24h)" value={formatNumber(metrics.failedCrons)} />
        <StatCard label="KRA errors" value={formatNumber(metrics.kraErrors.length)} />
        <StatCard
          label="Latest audit"
          value={metrics.latestAudit ? labelize(metrics.latestAudit.action) : "—"}
          note={
            metrics.latestAudit
              ? `${metrics.latestAudit.org?.name ?? "Platform"} · ${formatDateTime(metrics.latestAudit.createdAt)}`
              : undefined
          }
        />
      </section>

      <Surface
        title="Payment gateway attention"
        description="FAILED or stuck PENDING/INITIATED payments. Check Daraja/KCB callbacks and org payment ops."
      >
        {metrics.recentFailedPayments.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No recent gateway failures or stuck pending payments.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {metrics.recentFailedPayments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-col gap-1.5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
              >
                <div className="min-w-0">
                  <AdminLink href={`/platform/organizations/${payment.org.slug}`}>
                    {payment.org.name}
                  </AdminLink>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {payment.method} · {payment.externalReference ?? payment.id}
                    {" · "}
                    {formatDateTime(payment.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone={toneForStatus(payment.gatewayStatus)}>
                    {payment.gatewayStatus}
                  </Badge>
                  <Badge tone={toneForStatus(payment.verificationStatus)}>
                    {payment.verificationStatus}
                  </Badge>
                  <span className="text-sm font-semibold tabular-nums">
                    {Number(payment.amount).toLocaleString("en-KE")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <Surface
        title="KRA integration alerts"
        description="Organizations with ERROR status or a recorded lastError."
      >
        {metrics.kraErrors.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No KRA integration errors recorded.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {metrics.kraErrors.map((item) => (
              <li key={item.id} className="space-y-2 px-3 py-3.5 sm:px-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/platform/organizations/${item.org.slug}`}
                      className="text-sm font-semibold text-foreground hover:underline"
                    >
                      {item.org.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      /{item.org.slug}
                    </p>
                  </div>
                  <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                </div>
                {item.lastError ? (
                  <p className="break-words text-xs text-red-700 dark:text-red-300">
                    {item.lastError}
                  </p>
                ) : null}
                <p className="text-[11px] text-muted-foreground">
                  Updated {formatDateTime(item.updatedAt)} · {item.environment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Surface>
    </div>
  );
}
