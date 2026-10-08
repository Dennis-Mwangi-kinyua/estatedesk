import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { SidebarSticker } from "@/components/shared/sidebar-sticker";
import { prisma } from "@/lib/prisma";
import { getIntegrationReadinessReport } from "@/lib/integrations";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  Badge,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
  toneForStatus,
} from "../_components/control-plane";
import { developerNavItems } from "../_lib/nav";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string }>;

export default async function DeveloperPortalPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const isSuperAdmin = session.platformRole === "SUPER_ADMIN";
  const params = searchParams ? await searchParams : {};

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const metricResults = await Promise.allSettled([
    retryTransientDatabaseOperation(() => prisma.apiKey.count({ where: { isActive: true } }), { label: "developer-api-keys", attempts: 2 }),
    retryTransientDatabaseOperation(() => prisma.notification.groupBy({ where: { status: { in: ["QUEUED", "FAILED"] } }, by: ["status"], _count: { _all: true } }), { label: "developer-notification-queue", attempts: 2 }),
    retryTransientDatabaseOperation(() => prisma.notification.count({ where: { status: "SENT", sentAt: { gte: dayAgo } } }), { label: "developer-sent-notifications", attempts: 2 }),
    retryTransientDatabaseOperation(() => prisma.payment.count({ where: { gatewayStatus: "FAILED" } }), { label: "developer-failed-payments", attempts: 2 }),
    retryTransientDatabaseOperation(() => prisma.auditLog.findFirst({ orderBy: { createdAt: "desc" }, select: { action: true, createdAt: true, org: { select: { name: true } } } }), { label: "developer-latest-audit", attempts: 2 }),
    retryTransientDatabaseOperation(() => prisma.dataExportRequest.count({ where: { status: "PENDING" } }), { label: "developer-exports", attempts: 2 }),
    retryTransientDatabaseOperation(() => prisma.cronJobRun.count({ where: { status: "FAILED", startedAt: { gte: dayAgo } } }), { label: "developer-cron-failures", attempts: 2 }),
  ]);
  const [keysResult, notificationsResult, sentResult, paymentsResult, auditResult, exportsResult, jobsResult] = metricResults;
  const activeApiKeys = keysResult.status === "fulfilled" ? keysResult.value : null;
  const queuedNotifications = notificationsResult.status === "fulfilled" ? notificationsResult.value.find(group => group.status === "QUEUED")?._count._all ?? 0 : null;
  const failedNotifications = notificationsResult.status === "fulfilled" ? notificationsResult.value.find(group => group.status === "FAILED")?._count._all ?? 0 : null;
  const sentNotifications = sentResult.status === "fulfilled" ? sentResult.value : null;
  const failedPayments = paymentsResult.status === "fulfilled" ? paymentsResult.value : null;
  const latestAudit = auditResult.status === "fulfilled" ? auditResult.value : null;
  const exportPending = exportsResult.status === "fulfilled" ? exportsResult.value : null;
  const recentJobFailures = jobsResult.status === "fulfilled" ? jobsResult.value : null;
  const unavailableMetrics = metricResults.filter(result => result.status === "rejected").length;
  metricResults.forEach((result, index) => {
    if (result.status === "rejected") console.error("[developer.metrics]", { metric: ["apiKeys", "notificationQueue", "sentNotifications", "failedPayments", "audit", "exports", "jobs"][index], code: result.reason?.code ?? "unknown", name: result.reason?.name ?? "unknown" });
  });
  const metricNumber = (value: number | null) => value === null ? "Unavailable" : formatNumber(value);

  const integrationReadiness = getIntegrationReadinessReport();
  const tools = developerNavItems.filter((item) => {
    if (item.href === "/platform/developer") return false;
    if (item.superAdminOnly && !isSuperAdmin) return false;
    return true;
  });

  const accessRows = [
    {
      tool: "Site ops: orgs, users, admins, permissions, support, billing",
      platformAdmin: true,
      superAdmin: true,
    },
    {
      tool: "Developer home, health, API explorer, flags, rate-limit ops",
      platformAdmin: true,
      superAdmin: true,
    },
    {
      tool: "System Docs (private deep documentation)",
      platformAdmin: true,
      superAdmin: true,
    },
    {
      tool: "API keys vault",
      platformAdmin: true,
      superAdmin: true,
    },
    {
      tool: "Jobs & queues",
      platformAdmin: true,
      superAdmin: true,
    },
    {
      tool: "Data management / backups",
      platformAdmin: true,
      superAdmin: true,
    },
    {
      tool: "Help · Security · Audit (dual mode)",
      platformAdmin: true,
      superAdmin: true,
    },
    {
      tool: "Website Control (kill switches, nuclear ops)",
      platformAdmin: false,
      superAdmin: true,
    },
  ] as const;

  function AccessPill({ allowed, label }: { allowed: boolean; label: string }) {
    return (
      <span
        className={[
          "inline-flex min-h-8 items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
          allowed
            ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
            : "border-border bg-muted/50 text-muted-foreground",
        ].join(" ")}
      >
        <span aria-hidden="true">{allowed ? "✓" : "–"}</span>
        <span>{label}</span>
        <span className="sr-only">{allowed ? "allowed" : "not allowed"}</span>
      </span>
    );
  }

  return (
    <div className="developer-glass-page mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">
      {params.error === "super-admin-only" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50 sm:px-4">
          That tool requires a <strong>super admin</strong>. Platform admins can run
          site ops (orgs, users, billing, support), API keys, jobs, data, backups,
          flags, rate limits, health, help, security, and audit — only Website Control
          stays super-admin only.
        </div>
      ) : null}

      <section className="developer-glass-hero system-glass-card rounded-3xl border p-5 sm:p-8">
      <p className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-violet-800 dark:text-violet-200"><SidebarSticker href="/platform/developer" /> Your engineering workspace</p>
      <PageHeader
        eyebrow="Developer portal"
        title="Build. Connect. Keep things moving."
        description="Your integrations, background jobs, and platform tools in one clear workspace. Explore a tool below or check what needs attention."
        action={
          <>
            <Link
              href="/platform/developer/docs"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-900 transition hover:bg-violet-100 dark:border-violet-500/40 dark:bg-violet-500/15 dark:text-violet-100 dark:hover:bg-violet-500/25"
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              System docs
            </Link>
            {isSuperAdmin ? (
              <Link
                href="/platform/control"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Website control
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            ) : null}
            <Link
              href="/platform"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Switch to Admin
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          </>
        }
      />
      </section>

      {unavailableMetrics > 0 && <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm"><p>Some operational metrics could not be loaded. Available data and developer tools are shown below.</p><div className="mt-2 flex flex-wrap gap-4"><Link href="/platform/developer" className="font-semibold underline">Retry metrics</Link><Link href="/platform/system-health" className="font-semibold underline">Check system health</Link></div></div>}
      <section className="developer-glass-stats grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active API keys" value={metricNumber(activeApiKeys)} />
        <StatCard
          label="Queued notifications"
          value={metricNumber(queuedNotifications)}
        />
        <StatCard
          label="Failed notifications"
          value={metricNumber(failedNotifications)}
        />
        <StatCard label="Failed payments" value={metricNumber(failedPayments)} />
        <StatCard label="Sent in 24h" value={metricNumber(sentNotifications)} />
        <StatCard
          label="Failed cron runs (24h)"
          value={metricNumber(recentJobFailures)}
        />
        <StatCard label="Pending data exports" value={metricNumber(exportPending)} />
        <StatCard
          label="Latest audit"
          value={latestAudit?.action?.replaceAll("_", " ") ?? (auditResult.status === "rejected" ? "Unavailable" : "No activity")}
          note={
            latestAudit
              ? `${latestAudit.org?.name ?? "Platform"} • ${formatDateTime(latestAudit.createdAt)}`
              : undefined
          }
        />
      </section>

      <Surface
        title="Developer tools"
        description="Choose a tool to manage integrations, monitor operations, or support your workspaces."
      >
        <div className="grid grid-cols-1 gap-2 p-3 min-[480px]:grid-cols-2 min-[480px]:gap-3 min-[480px]:p-4 xl:grid-cols-3">
          {tools.map((tool) => {

            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="developer-glass-tool group flex min-h-[4.5rem] items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition active:scale-[0.99] hover:border-violet-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950 dark:hover:border-violet-500/40 sm:p-4 sm:hover:-translate-y-0.5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                  <SidebarSticker href={tool.href} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-5 text-slate-950 dark:text-white">
                      {tool.label}
                    </p>
                    <div className="flex shrink-0 items-center gap-1 pt-0.5">
                      {tool.superAdminOnly ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                          SA
                        </span>
                      ) : null}
                      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-violet-600 dark:group-hover:text-violet-300" />
                    </div>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {tool.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Surface
          title="Integration readiness"
          description="Snapshot of configured external integrations for this environment."
        >
          <div className="border-b border-slate-100 px-3 py-3 dark:border-white/10 sm:px-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge tone={toneForStatus("READY")}>
                Ready {integrationReadiness.totals.ready}
              </Badge>
              <Badge tone={toneForStatus("PENDING")}>
                Partial {integrationReadiness.totals.partial}
              </Badge>
              <Badge tone={toneForStatus("PENDING")}>
                Pending approval {integrationReadiness.totals.pendingApproval}
              </Badge>
              <Badge tone={toneForStatus("FAILED")}>
                Misconfigured {integrationReadiness.totals.misconfigured}
              </Badge>
              <Badge tone={toneForStatus("DISABLED")}>
                Stubbed {integrationReadiness.totals.stubbed}
              </Badge>
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {integrationReadiness.integrations.slice(0, 8).map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 px-3 py-3 sm:items-center sm:px-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {item.category} · {item.region}
                    {item.missingEnv.length > 0
                      ? ` · missing ${item.missingEnv.length} env`
                      : " · env complete"}
                  </p>
                </div>
                <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
              </div>
            ))}
          </div>
        </Surface>

        <Surface
          title="Mode switch & shortcuts"
          description="Administration and Developer share platform access. Last path per mode is remembered when you toggle."
        >
          <div className="grid gap-3 p-3 sm:p-4">
            <Link
              href="/platform"
              className="rounded-xl border border-border bg-muted/40 p-4 transition hover:bg-card active:scale-[0.99]"
            >
              <p className="text-sm font-semibold text-foreground">
                Administration mode
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Organizations, users, billing, onboarding, marketing, messages, and
                settings. Shortcut: Alt+Shift+A
              </p>
            </Link>
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/30 dark:bg-violet-500/10">
              <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                Developer mode (current)
              </p>
              <p className="mt-1 text-xs leading-5 text-violet-800/80 dark:text-violet-200/80">
                Health, APIs, flags, rate limits, dual-mode help/security/audit, and
                site ops, keys, jobs, data, and backups. Website Control is
                super-admin only. Shortcut: Alt+Shift+D
              </p>
            </div>
          </div>
        </Surface>
      </div>

      <Surface
        title="Access matrix"
        description="Platform admins get full site ops plus engineering tools. Only Website Control is SUPER_ADMIN-only."
      >
        {/* Mobile-first list (default). No table on small screens. */}
        <ul className="ed-access-matrix-list divide-y divide-border lg:hidden">
          {accessRows.map((row) => {
            const saOnly = !row.platformAdmin && row.superAdmin;

            return (
              <li key={row.tool} className="px-3 py-3.5 sm:px-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-sm font-semibold leading-5 text-foreground">
                    {row.tool}
                  </p>
                  {saOnly ? (
                    <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">
                      SA only
                    </span>
                  ) : null}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <AccessPill allowed={row.platformAdmin} label="Platform admin" />
                  <AccessPill allowed={row.superAdmin} label="Super admin" />
                </div>
              </li>
            );
          })}
        </ul>

        {/* Large screens only — wide comparison table */}
        <div className="ed-access-matrix-table hidden lg:block">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="w-[48%] px-4 py-3 font-medium">Tool</th>
                <th className="w-[26%] px-4 py-3 font-medium">Platform admin</th>
                <th className="w-[26%] px-4 py-3 font-medium">Super admin</th>
              </tr>
            </thead>
            <tbody>
              {accessRows.map((row) => (
                <tr key={row.tool} className="border-t border-border">
                  <td className="whitespace-normal px-4 py-3 align-top font-medium text-foreground">
                    {row.tool}
                    {!row.platformAdmin && row.superAdmin ? (
                      <span className="ml-2 inline-flex rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">
                        SA
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-normal px-4 py-3 align-top">
                    <AccessPill allowed={row.platformAdmin} label={row.platformAdmin ? "Yes" : "No"} />
                  </td>
                  <td className="whitespace-normal px-4 py-3 align-top">
                    <AccessPill allowed={row.superAdmin} label={row.superAdmin ? "Yes" : "No"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
