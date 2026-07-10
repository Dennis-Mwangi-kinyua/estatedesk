import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Code2,
  Database,
  FileChartColumn,
  Flag,
  HardDrive,
  KeyRound,
  Settings,
  ShieldAlert,
  Timer,
  Webhook,
  type LucideIcon,
} from "lucide-react";
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

const toolIcons: Record<string, LucideIcon> = {
  "/platform/developer": Code2,
  "/platform/control": Settings,
  "/platform/system-health": Activity,
  "/platform/api-explorer": Webhook,
  "/platform/api-keys": KeyRound,
  "/platform/feature-flags": Flag,
  "/platform/jobs": Settings,
  "/platform/rate-limits": Timer,
  "/platform/data-management": Database,
  "/platform/backups": HardDrive,
  "/platform/audit-logs": FileChartColumn,
  "/platform/security": ShieldAlert,
  "/platform/help": BookOpen,
};

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

  const [
    activeApiKeys,
    queuedNotifications,
    failedNotifications,
    sentNotifications,
    failedPayments,
    latestAudit,
    exportPending,
    recentJobFailures,
  ] = await Promise.all([
    prisma.apiKey.count({ where: { isActive: true } }),
    prisma.notification.count({ where: { status: "QUEUED" } }),
    prisma.notification.count({ where: { status: "FAILED" } }),
    prisma.notification.count({
      where: { status: "SENT", sentAt: { gte: dayAgo } },
    }),
    prisma.payment.count({ where: { gatewayStatus: "FAILED" } }),
    prisma.auditLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: {
        action: true,
        createdAt: true,
        org: { select: { name: true } },
      },
    }),
    prisma.dataExportRequest.count({ where: { status: "PENDING" } }),
    prisma.cronJobRun.count({
      where: { status: "FAILED", startedAt: { gte: dayAgo } },
    }),
  ]);

  const integrationReadiness = getIntegrationReadinessReport();
  const tools = developerNavItems.filter((item) => {
    if (item.href === "/platform/developer") return false;
    if (item.superAdminOnly && !isSuperAdmin) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {params.error === "super-admin-only" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
          That tool requires a <strong>super admin</strong>. Platform admins can use
          health, feature flags, API explorer, rate-limit inspection, help, security,
          and audit logs.
        </div>
      ) : null}

      <PageHeader
        eyebrow="Developer portal"
        title="Engineering control plane"
        description="Full engineering control of the EstateDesk website: kill switches, APIs, jobs, flags, data, and super-admin nuclear ops. Switch back to Administration with the mode toggle or Alt+Shift+A."
        action={
          <div className="flex flex-wrap gap-2">
            {isSuperAdmin ? (
              <Link
                href="/platform/control"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Website control
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
            <Link
              href="/platform"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Switch to Admin
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active API keys" value={formatNumber(activeApiKeys)} />
        <StatCard
          label="Queued notifications"
          value={formatNumber(queuedNotifications)}
        />
        <StatCard
          label="Failed notifications"
          value={formatNumber(failedNotifications)}
        />
        <StatCard label="Failed payments" value={formatNumber(failedPayments)} />
        <StatCard label="Sent in 24h" value={formatNumber(sentNotifications)} />
        <StatCard
          label="Failed cron runs (24h)"
          value={formatNumber(recentJobFailures)}
        />
        <StatCard label="Pending data exports" value={formatNumber(exportPending)} />
        <StatCard
          label="Latest audit"
          value={latestAudit?.action?.replaceAll("_", " ") ?? "-"}
          note={
            latestAudit
              ? `${latestAudit.org?.name ?? "Platform"} • ${formatDateTime(latestAudit.createdAt)}`
              : undefined
          }
        />
      </section>

      <Surface
        title="Developer tools"
        description="Jump into operational and integration tooling without leaving the platform super-admin shell."
      >
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => {
            const Icon = toolIcons[tool.href] ?? Code2;

            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950 dark:hover:border-violet-500/40"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                      {tool.label}
                    </p>
                    <div className="flex shrink-0 items-center gap-1">
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

      <div className="grid gap-4 xl:grid-cols-2">
        <Surface
          title="Integration readiness"
          description="Snapshot of configured external integrations for this environment."
        >
          <div className="border-b border-slate-100 px-4 py-3 dark:border-white/10">
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
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.name}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
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
          <div className="grid gap-3 p-4">
            <Link
              href="/platform"
              className="rounded-xl border border-border bg-muted/40 p-4 transition hover:bg-card"
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
                super-admin-only keys/jobs/data/backups. Shortcut: Alt+Shift+D
              </p>
            </div>
          </div>
        </Surface>
      </div>

      <Surface
        title="Access matrix"
        description="Who can open which tools. SA = SUPER_ADMIN only."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tool</th>
                <th className="px-4 py-3 font-medium">PLATFORM_ADMIN</th>
                <th className="px-4 py-3 font-medium">SUPER_ADMIN</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Admin dashboard, orgs, users, billing, onboarding", "Yes", "Yes"],
                ["Support Access (timed org entry)", "Yes", "Yes"],
                ["Developer home, health, API explorer, flags, rate limits", "Yes", "Yes"],
                ["Website Control (kill switches, nuclear ops)", "No", "Yes"],
                ["API keys vault", "No", "Yes"],
                ["Jobs & queues", "No", "Yes"],
                ["Data management / backups", "No", "Yes"],
                ["Help · Website control / Admin ops guides", "Yes", "Yes"],
              ].map(([tool, pa, sa]) => (
                <tr key={tool} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{tool}</td>
                  <td className="px-4 py-3 text-muted-foreground">{pa}</td>
                  <td className="px-4 py-3 text-muted-foreground">{sa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
