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
  "/platform/developer/docs": BookOpen,
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

  const accessRows = [
    {
      tool: "Admin dashboard, orgs, users, billing, onboarding",
      platformAdmin: true,
      superAdmin: true,
    },
    {
      tool: "Support Access (timed org entry)",
      platformAdmin: true,
      superAdmin: true,
    },
    {
      tool: "Developer home, health, API explorer, flags, rate limits",
      platformAdmin: true,
      superAdmin: true,
    },
    {
      tool: "System Docs (private deep documentation)",
      platformAdmin: true,
      superAdmin: true,
    },
    {
      tool: "Website Control (kill switches, nuclear ops)",
      platformAdmin: false,
      superAdmin: true,
    },
    {
      tool: "API keys vault",
      platformAdmin: false,
      superAdmin: true,
    },
    {
      tool: "Jobs & queues",
      platformAdmin: false,
      superAdmin: true,
    },
    {
      tool: "Data management / backups",
      platformAdmin: false,
      superAdmin: true,
    },
    {
      tool: "Help · Website control / Admin ops guides",
      platformAdmin: true,
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
    <div className="mx-auto w-full max-w-7xl space-y-4 sm:space-y-6">
      {params.error === "super-admin-only" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50 sm:px-4">
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

      <section className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
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
        <div className="grid grid-cols-1 gap-2 p-3 min-[480px]:grid-cols-2 min-[480px]:gap-3 min-[480px]:p-4 xl:grid-cols-3">
          {tools.map((tool) => {
            const Icon = toolIcons[tool.href] ?? Code2;

            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex min-h-[4.5rem] items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition active:scale-[0.99] hover:border-violet-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950 dark:hover:border-violet-500/40 sm:p-4 sm:hover:-translate-y-0.5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">
                  <Icon className="h-5 w-5" />
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
                super-admin-only keys/jobs/data/backups. Shortcut: Alt+Shift+D
              </p>
            </div>
          </div>
        </Surface>
      </div>

      <Surface
        title="Access matrix"
        description="Who can open which tools. SA-only rows need SUPER_ADMIN."
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
