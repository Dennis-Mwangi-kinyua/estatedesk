import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  KeyRound,
  Power,
  ShieldAlert,
  Users,
  Zap,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  getPlatformControl,
  defaultMaintenanceMessage,
} from "@/lib/platform/control";
import {
  Badge,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
  toneForStatus,
} from "../_components/control-plane";
import { PLATFORM_FEATURE_FLAG_KEYS } from "../_lib/nav";
import {
  clearAllRateLimitsAction,
  enterOrgAsSupportAction,
  forceAllOrgsFeatureAction,
  forceOrgStatusAction,
  forcePasswordChangeAction,
  forceUserStatusAction,
  overrideSubscriptionAction,
  purgeFailedNotificationsAction,
  restoreOrgAction,
  revokeAllApiKeysAction,
  revokeAllSessionsAction,
  runAllCronJobsAction,
  softDeleteOrgAction,
  updateGlobalFeatureKillAction,
  updateKillSwitchesAction,
} from "./actions";
import { ControlOrgTableFilter } from "./org-table-filter";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  ok?: string;
  error?: string;
  count?: string;
}>;

function flashMessage(params: { ok?: string; error?: string; count?: string }) {
  if (params.error === "super-admin-only") {
    return { tone: "error" as const, text: "Super admin only." };
  }
  if (params.error === "confirm-force-all") {
    return { tone: "error" as const, text: 'Type FORCE-ALL-ORGS to confirm.' };
  }
  if (params.error === "confirm-sessions") {
    return { tone: "error" as const, text: "Type REVOKE-ALL-SESSIONS to confirm." };
  }
  if (params.error === "confirm-api-keys") {
    return { tone: "error" as const, text: "Type REVOKE-ALL-API-KEYS to confirm." };
  }
  if (params.error === "confirm-rate-limits") {
    return { tone: "error" as const, text: "Type CLEAR-RATE-LIMITS to confirm." };
  }
  if (params.error === "confirm-purge") {
    return { tone: "error" as const, text: "Type PURGE-FAILED-NOTIFICATIONS to confirm." };
  }
  if (params.error === "confirm-crons") {
    return { tone: "error" as const, text: "Type RUN-ALL-CRONS to confirm." };
  }
  if (params.error === "cron-disabled") {
    return { tone: "error" as const, text: "Cron is disabled by a kill switch." };
  }
  if (params.error === "support-reason") {
    return { tone: "error" as const, text: "Support entry needs a reason (8+ chars)." };
  }
  if (params.error === "root-protected") {
    return { tone: "error" as const, text: "Root super admin is protected." };
  }
  if (params.error === "self-protected") {
    return { tone: "error" as const, text: "You cannot target your own account that way." };
  }
  if (params.error) {
    return { tone: "error" as const, text: `Action failed (${params.error}).` };
  }
  if (params.ok === "kill-switches") {
    return { tone: "ok" as const, text: "Website kill switches saved." };
  }
  if (params.ok === "global-feature") {
    return { tone: "ok" as const, text: "Global feature override updated." };
  }
  if (params.ok === "sessions") {
    return {
      tone: "ok" as const,
      text: `Revoked ${params.count ?? "all"} other sessions across the website.`,
    };
  }
  if (params.ok === "api-keys") {
    return { tone: "ok" as const, text: `Revoked ${params.count ?? "0"} API keys.` };
  }
  if (params.ok === "rate-limits") {
    return { tone: "ok" as const, text: `Cleared ${params.count ?? "0"} rate-limit buckets.` };
  }
  if (params.ok === "purge-notifications") {
    return {
      tone: "ok" as const,
      text: `Purged ${params.count ?? "0"} failed notifications.`,
    };
  }
  if (params.ok === "crons") {
    return { tone: "ok" as const, text: "All cron jobs triggered." };
  }
  if (params.ok === "force-all-features") {
    return {
      tone: "ok" as const,
      text: `Feature forced across ${params.count ?? "0"} organizations.`,
    };
  }
  if (params.ok) {
    return { tone: "ok" as const, text: "Command completed." };
  }
  return null;
}

function SwitchRow({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
      <input
        type="checkbox"
        name={name}
        value="true"
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-950 dark:text-white">
          {label}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </span>
      </span>
    </label>
  );
}

export default async function WebsiteControlCenterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePlatformRole(["SUPER_ADMIN"], {
    redirectTo: "/platform/developer?error=super-admin-only",
  });

  const params = await searchParams;
  const flash = flashMessage(params);

  const control = await getPlatformControl();

  const [
    orgCount,
    userCount,
    activeSessions,
    activeApiKeys,
    failedNotifications,
    rateBuckets,
    organizations,
    deletedOrgs,
  ] = await Promise.all([
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.userSession.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.apiKey.count({ where: { isActive: true } }),
    prisma.notification.count({ where: { status: "FAILED" } }),
    prisma.rateLimitBucket.count(),
    prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      take: 300,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        subscription: { select: { plan: true, status: true } },
      },
    }),
    prisma.organization.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, name: true, slug: true, deletedAt: true },
    }),
  ]);

  const activeKills = [
    control.maintenanceMode,
    control.publicSignupDisabled,
    control.publicApiDisabled,
    control.webhooksDisabled,
    control.cronDisabled,
    control.tenantPortalsDisabled,
    control.orgDashboardsDisabled,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <ControlOrgTableFilter />
      <PageHeader
        eyebrow="Developer portal · Super admin"
        title="Website control center"
        description="Full power over the EstateDesk website: maintenance mode, public surfaces, queues, sessions, API keys, organizations, and emergency ops. Every action is audit-logged."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/platform/developer"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
            >
              Developer home
            </Link>
            <Link
              href="/platform/system-health"
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              System health
            </Link>
          </div>
        }
      />

      {flash ? (
        <div
          className={
            flash.tone === "error"
              ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
              : "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
          }
        >
          {flash.text}
        </div>
      ) : null}

      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-50">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Extreme control.</strong> These switches affect the live website for all
            tenants, public visitors, cron, and APIs. Prefer scoped org tools when possible.
            Last updated {formatDateTime(control.updatedAt)}.
          </p>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active kill switches" value={formatNumber(activeKills)} />
        <StatCard label="Organizations" value={formatNumber(orgCount)} />
        <StatCard label="Users" value={formatNumber(userCount)} />
        <StatCard label="Live sessions" value={formatNumber(activeSessions)} />
        <StatCard label="Active API keys" value={formatNumber(activeApiKeys)} />
        <StatCard label="Failed notifications" value={formatNumber(failedNotifications)} />
        <StatCard label="Rate-limit buckets" value={formatNumber(rateBuckets)} />
        <StatCard
          label="Maintenance"
          value={control.maintenanceMode ? "ON" : "OFF"}
          note={control.maintenanceMode ? defaultMaintenanceMessage(control) : "Site open"}
        />
      </section>

      {/* Kill switches */}
      <Surface
        title="Website kill switches"
        description="Instantly enable or disable major surfaces of the live product."
      >
        <form action={updateKillSwitchesAction} className="space-y-4 p-4">
          <div className="grid gap-3 lg:grid-cols-2">
            <SwitchRow
              name="maintenanceMode"
              label="Maintenance mode"
              description="Blocks org, tenant, caretaker, and landlord dashboards (platform admins still pass)."
              defaultChecked={control.maintenanceMode}
            />
            <SwitchRow
              name="incidentMode"
              label="Incident mode banner"
              description="Shows a public incident banner on marketing/auth pages without fully blocking dashboards."
              defaultChecked={control.incidentMode}
            />
            <SwitchRow
              name="publicSignupDisabled"
              label="Disable public signup / onboarding requests"
              description="Stops new company access requests on /register."
              defaultChecked={control.publicSignupDisabled}
            />
            <SwitchRow
              name="publicApiDisabled"
              label="Disable public API"
              description="Blocks /api/public/* (vacant houses and similar)."
              defaultChecked={control.publicApiDisabled}
            />
            <SwitchRow
              name="webhooksDisabled"
              label="Disable webhooks"
              description="Rejects inbound provider webhooks (e.g. M-Pesa)."
              defaultChecked={control.webhooksDisabled}
            />
            <SwitchRow
              name="cronDisabled"
              label="Disable cron jobs"
              description="Rejects scheduled and manual cron endpoints."
              defaultChecked={control.cronDisabled}
            />
            <SwitchRow
              name="orgDashboardsDisabled"
              label="Disable organization dashboards"
              description="Blocks /dashboard/org and related office workspaces."
              defaultChecked={control.orgDashboardsDisabled}
            />
            <SwitchRow
              name="tenantPortalsDisabled"
              label="Disable tenant / caretaker / landlord portals"
              description="Blocks field and tenant-facing dashboards."
              defaultChecked={control.tenantPortalsDisabled}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Maintenance message
              </span>
              <textarea
                name="maintenanceMessage"
                defaultValue={control.maintenanceMessage ?? ""}
                rows={3}
                placeholder={defaultMaintenanceMessage(control)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Incident message
              </span>
              <textarea
                name="incidentMessage"
                defaultValue={control.incidentMessage ?? ""}
                rows={3}
                placeholder="We are investigating elevated payment webhook latency…"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Operator notes
              </span>
              <textarea
                name="notes"
                defaultValue={control.notes ?? ""}
                rows={3}
                placeholder="Why these switches are set…"
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-violet-400"
              />
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            <Power className="h-4 w-4" />
            Save kill switches
          </button>
        </form>
      </Surface>

      {/* Global feature overrides */}
      <Surface
        title="Global feature overrides"
        description="Force a feature on/off website-wide, or inherit per-org settings. Use FORCE-ALL-ORGS to rewrite every organization."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Feature</th>
                <th className="px-4 py-3 font-medium">Override</th>
                <th className="px-4 py-3 font-medium">Set</th>
                <th className="px-4 py-3 font-medium">Force all orgs</th>
              </tr>
            </thead>
            <tbody>
              {PLATFORM_FEATURE_FLAG_KEYS.map((key) => {
                const current =
                  key in control.globalFeatures
                    ? control.globalFeatures[key]
                      ? "on"
                      : "off"
                    : "inherit";

                return (
                  <tr key={key} className="border-t border-slate-100 dark:border-white/10">
                    <td className="px-4 py-3 font-medium text-slate-950 dark:text-white">
                      {key}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          current === "on"
                            ? toneForStatus("ACTIVE")
                            : current === "off"
                              ? toneForStatus("DISABLED")
                              : toneForStatus("PENDING")
                        }
                      >
                        {current.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <form action={updateGlobalFeatureKillAction} className="flex flex-wrap gap-1">
                        <input type="hidden" name="featureKey" value={key} />
                        <button
                          name="mode"
                          value="on"
                          className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                        >
                          On
                        </button>
                        <button
                          name="mode"
                          value="off"
                          className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Off
                        </button>
                        <button
                          name="mode"
                          value="inherit"
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Inherit
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <form action={forceAllOrgsFeatureAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="featureKey" value={key} />
                        <input type="hidden" name="enabled" value="true" />
                        <input
                          name="confirmation"
                          placeholder="FORCE-ALL-ORGS"
                          className="h-8 w-36 rounded-lg border border-slate-200 px-2 text-xs dark:border-white/10 dark:bg-slate-950"
                        />
                        <button className="rounded-lg bg-slate-950 px-2 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                          Force ON all
                        </button>
                      </form>
                      <form action={forceAllOrgsFeatureAction} className="mt-1 flex flex-wrap items-center gap-2">
                        <input type="hidden" name="featureKey" value={key} />
                        <input type="hidden" name="enabled" value="false" />
                        <input
                          name="confirmation"
                          placeholder="FORCE-ALL-ORGS"
                          className="h-8 w-36 rounded-lg border border-slate-200 px-2 text-xs dark:border-white/10 dark:bg-slate-950"
                        />
                        <button className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
                          Force OFF all
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>

      {/* Nuclear website ops */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Surface title="Session & credential nuclear" description="Immediate website-wide access control.">
          <div className="space-y-4 p-4">
            <form action={revokeAllSessionsAction} className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-500/30 dark:bg-red-500/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-900 dark:text-red-100">
                <Users className="h-4 w-4" />
                Revoke all sessions except yours
              </div>
              <p className="mt-1 text-xs text-red-800/80 dark:text-red-100/80">
                Forces every other user to re-login. Confirm with REVOKE-ALL-SESSIONS.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  name="confirmation"
                  placeholder="REVOKE-ALL-SESSIONS"
                  className="h-10 flex-1 rounded-xl border border-red-200 bg-white px-3 text-sm dark:border-red-500/30 dark:bg-slate-950"
                />
                <button className="rounded-xl bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-600">
                  Revoke
                </button>
              </div>
            </form>

            <form action={revokeAllApiKeysAction} className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-500/30 dark:bg-red-500/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-900 dark:text-red-100">
                <KeyRound className="h-4 w-4" />
                Revoke all API keys
              </div>
              <p className="mt-1 text-xs text-red-800/80">Confirm with REVOKE-ALL-API-KEYS.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  name="confirmation"
                  placeholder="REVOKE-ALL-API-KEYS"
                  className="h-10 flex-1 rounded-xl border border-red-200 bg-white px-3 text-sm dark:border-red-500/30 dark:bg-slate-950"
                />
                <button className="rounded-xl bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-600">
                  Revoke keys
                </button>
              </div>
            </form>

            <form action={clearAllRateLimitsAction} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                Clear all rate-limit buckets
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  name="confirmation"
                  placeholder="CLEAR-RATE-LIMITS"
                  className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm dark:border-white/10 dark:bg-slate-950"
                />
                <button className="rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
                  Clear
                </button>
              </div>
            </form>
          </div>
        </Surface>

        <Surface title="Jobs & queue nuclear" description="Background processing control for the whole website.">
          <div className="space-y-4 p-4">
            <form action={runAllCronJobsAction} className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-500/30 dark:bg-violet-500/10">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-950 dark:text-violet-100">
                <Zap className="h-4 w-4" />
                Run all cron jobs now
              </div>
              <p className="mt-1 text-xs text-violet-900/80 dark:text-violet-100/80">
                Notifications, retention, owner statements. Confirm RUN-ALL-CRONS.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  name="confirmation"
                  placeholder="RUN-ALL-CRONS"
                  className="h-10 flex-1 rounded-xl border border-violet-200 bg-white px-3 text-sm dark:border-violet-500/30 dark:bg-slate-950"
                />
                <button className="rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-600">
                  Run all
                </button>
              </div>
            </form>

            <form action={purgeFailedNotificationsAction} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                Purge failed notifications
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Permanently deletes FAILED notification rows. Confirm PURGE-FAILED-NOTIFICATIONS.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  name="confirmation"
                  placeholder="PURGE-FAILED-NOTIFICATIONS"
                  className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm dark:border-white/10 dark:bg-slate-950"
                />
                <button className="rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 hover:bg-red-50">
                  Purge
                </button>
              </div>
            </form>
          </div>
        </Surface>
      </div>

      {/* User force controls */}
      <Surface
        title="User force controls"
        description="Suspend, disable, or force password change by email, username, or user id."
      >
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          <form action={forceUserStatusAction} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Set user status</p>
            <input
              name="identifier"
              required
              placeholder="email / username / id"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm dark:border-white/10 dark:bg-slate-950"
            />
            <select
              name="status"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm dark:border-white/10 dark:bg-slate-950"
              defaultValue="SUSPENDED"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="DISABLED">DISABLED</option>
            </select>
            <button className="h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">
              Apply status
            </button>
          </form>

          <form action={forcePasswordChangeAction} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">
              Force password change + kill sessions
            </p>
            <input
              name="identifier"
              required
              placeholder="email / username / id"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm dark:border-white/10 dark:bg-slate-950"
            />
            <button className="h-11 w-full rounded-xl border border-amber-300 bg-amber-50 text-sm font-semibold text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-50">
              Force password change
            </button>
          </form>
        </div>
      </Surface>

      {/* Org controls */}
      <Surface
        title="Organization website control"
        description="Force org status, billing override, support entry into the live org workspace, soft-delete, and restore. Filter by name or slug."
      >
        <form className="border-b border-border p-4">
          <input
            name="q"
            defaultValue=""
            form="unused"
            id="control-org-filter"
            placeholder="Filter organizations…"
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Type to filter the table client-side (name or slug).
          </p>
        </form>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm" id="control-org-table">
            <thead className="bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Force status</th>
                <th className="px-4 py-3 font-medium">Billing override</th>
                <th className="px-4 py-3 font-medium">Support / delete</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr
                  key={org.id}
                  data-org-filter={`${org.name} ${org.slug}`.toLowerCase()}
                  className="control-org-row border-t border-border align-top"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/platform/organizations/${org.slug}`}
                      className="font-semibold text-foreground hover:underline"
                    >
                      {org.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">/{org.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(org.status)}>{org.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {org.subscription
                      ? `${org.subscription.plan} · ${org.subscription.status}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={forceOrgStatusAction} className="flex flex-wrap gap-1">
                      <input type="hidden" name="orgId" value={org.id} />
                      {(["ACTIVE", "SUSPENDED", "DISABLED"] as const).map((status) => (
                        <button
                          key={status}
                          name="status"
                          value={status}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold hover:bg-slate-50 dark:border-white/10"
                        >
                          {status}
                        </button>
                      ))}
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={overrideSubscriptionAction} className="space-y-1">
                      <input type="hidden" name="orgId" value={org.id} />
                      <select
                        name="plan"
                        defaultValue={org.subscription?.plan ?? "PRO"}
                        className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-white/10 dark:bg-slate-950"
                      >
                        <option value="FREE">FREE</option>
                        <option value="PRO">PRO</option>
                        <option value="PLUS">PLUS</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                      <select
                        name="status"
                        defaultValue={org.subscription?.status ?? "ACTIVE"}
                        className="h-8 w-full rounded-lg border border-slate-200 px-2 text-xs dark:border-white/10 dark:bg-slate-950"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="TRIALING">TRIALING</option>
                        <option value="PAST_DUE">PAST_DUE</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="EXPIRED">EXPIRED</option>
                      </select>
                      <button className="h-8 w-full rounded-lg bg-slate-950 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-950">
                        Override
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={enterOrgAsSupportAction} className="space-y-1">
                      <input type="hidden" name="orgId" value={org.id} />
                      <input
                        name="reason"
                        required
                        minLength={8}
                        placeholder="Support reason"
                        className="h-8 w-full rounded-lg border border-border bg-card px-2 text-xs"
                      />
                      <select
                        name="hours"
                        defaultValue="2"
                        className="h-8 w-full rounded-lg border border-border bg-card px-2 text-xs"
                      >
                        <option value="1">1h</option>
                        <option value="2">2h</option>
                        <option value="4">4h</option>
                        <option value="8">8h</option>
                      </select>
                      <button className="flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-violet-200 bg-violet-50 text-[11px] font-semibold text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100">
                        <Building2 className="h-3 w-3" />
                        Enter as support
                      </button>
                    </form>
                    <form action={softDeleteOrgAction} className="mt-2 space-y-1">
                      <input type="hidden" name="orgId" value={org.id} />
                      <input type="hidden" name="slug" value={org.slug} />
                      <input
                        name="confirmation"
                        placeholder={org.slug}
                        className="h-8 w-full rounded-lg border border-red-200 px-2 text-xs dark:border-red-500/30 dark:bg-slate-950"
                      />
                      <button className="h-8 w-full rounded-lg border border-red-200 text-[11px] font-semibold text-red-700 hover:bg-red-50">
                        Soft-delete (type slug)
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {organizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No organizations.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {deletedOrgs.length > 0 ? (
          <div className="border-t border-slate-100 p-4 dark:border-white/10">
            <p className="mb-3 text-sm font-semibold text-slate-950 dark:text-white">
              Soft-deleted organizations
            </p>
            <div className="space-y-2">
              {deletedOrgs.map((org) => (
                <div
                  key={org.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10"
                >
                  <div>
                    <p className="text-sm font-medium">{org.name}</p>
                    <p className="text-xs text-slate-500">
                      /{org.slug} · deleted {formatDateTime(org.deletedAt)}
                    </p>
                  </div>
                  <form action={restoreOrgAction}>
                    <input type="hidden" name="orgId" value={org.id} />
                    <button className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600">
                      Restore
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Surface>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Platform shell, security, and audit logs remain available under Developer mode.
            Nuclear actions never bypass root super-admin protection or audit trails.
          </p>
        </div>
      </div>
    </div>
  );
}
