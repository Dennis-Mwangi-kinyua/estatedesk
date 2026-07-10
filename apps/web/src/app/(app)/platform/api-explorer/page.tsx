import Link from "next/link";
import { KeyRound, Webhook } from "lucide-react";
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

export const dynamic = "force-dynamic";

type EndpointDoc = {
  method: string;
  path: string;
  auth: string;
  purpose: string;
  group: "public" | "webhook" | "cron" | "platform" | "health";
};

const endpoints: EndpointDoc[] = [
  {
    method: "GET",
    path: "/api/public/vacant-houses",
    auth: "Bearer edk_vacant_*",
    purpose: "Public vacant house listings for external sites",
    group: "public",
  },
  {
    method: "GET",
    path: "/api/health",
    auth: "None",
    purpose: "Liveness/readiness probe for platform health checks",
    group: "health",
  },
  {
    method: "POST",
    path: "/api/webhooks/mpesa",
    auth: "MPESA_CALLBACK_SECRET query param when configured",
    purpose: "M-Pesa STK callback reconciliation",
    group: "webhook",
  },
  {
    method: "GET/POST",
    path: "/api/cron/notifications",
    auth: "CRON_SECRET",
    purpose: "Dispatch queued notifications",
    group: "cron",
  },
  {
    method: "GET/POST",
    path: "/api/cron/retention",
    auth: "CRON_SECRET",
    purpose: "Retention and cleanup job",
    group: "cron",
  },
  {
    method: "GET/POST",
    path: "/api/cron/owner-statements",
    auth: "CRON_SECRET",
    purpose: "Scheduled owner statement emails",
    group: "cron",
  },
  {
    method: "GET",
    path: "/api/platform/data-exports/[slug]/download",
    auth: "Platform admin session",
    purpose: "Download approved organization data exports",
    group: "platform",
  },
  {
    method: "POST",
    path: "/api/monitoring/client-errors",
    auth: "Session / public beacon",
    purpose: "Client error reporting for ops diagnostics",
    group: "platform",
  },
  {
    method: "POST",
    path: "/api/monitoring/web-vitals",
    auth: "Session / public beacon",
    purpose: "Web vitals telemetry",
    group: "platform",
  },
];

export default async function ApiExplorerPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const [activeKeys, revokedKeys, recentKeys, integrationReadiness, webhookEvents] =
    await Promise.all([
      prisma.apiKey.count({ where: { isActive: true } }),
      prisma.apiKey.count({ where: { isActive: false } }),
      prisma.apiKey.findMany({
        orderBy: [{ lastUsedAt: "desc" }, { createdAt: "desc" }],
        take: 12,
        include: {
          org: { select: { name: true, slug: true } },
          createdBy: { select: { fullName: true } },
        },
      }),
      Promise.resolve(getIntegrationReadinessReport()),
      prisma.platformWebhookEvent
        .findMany({
          orderBy: { createdAt: "desc" },
          take: 25,
        })
        .catch(() => [] as Array<{
          id: string;
          provider: string;
          path: string;
          statusCode: number;
          summary: string | null;
          createdAt: Date;
        }>),
    ]);

  const webhookIntegrations = integrationReadiness.integrations.filter(
    (item) =>
      item.env.some((env) => env.key.toLowerCase().includes("webhook")) ||
      item.category === "payments" ||
      item.category === "messaging",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Developer portal"
        title="API & webhooks"
        description="Reference for public APIs, inbound webhooks, cron endpoints, and recent API key activity. Super admins manage credentials under API Keys."
        action={
          <Link
            href="/platform/api-keys"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
          >
            <KeyRound className="h-4 w-4" />
            API Keys
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active API keys" value={formatNumber(activeKeys)} />
        <StatCard label="Revoked keys" value={formatNumber(revokedKeys)} />
        <StatCard label="Documented endpoints" value={formatNumber(endpoints.length)} />
        <StatCard
          label="Webhook-related integrations"
          value={formatNumber(webhookIntegrations.length)}
        />
      </section>

      <Surface
        title="Endpoint catalog"
        description="High-value surface area for external and operational integrations."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Path</th>
                <th className="px-4 py-3 font-medium">Auth</th>
                <th className="px-4 py-3 font-medium">Group</th>
                <th className="px-4 py-3 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr
                  key={`${endpoint.method}:${endpoint.path}`}
                  className="border-t border-neutral-100 dark:border-white/10"
                >
                  <td className="px-4 py-3">
                    <Badge>{endpoint.method}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <code className="break-all text-xs text-slate-800 dark:text-slate-200">
                      {endpoint.path}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {endpoint.auth}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneForStatus(endpoint.group.toUpperCase())}>
                      {endpoint.group}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {endpoint.purpose}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <div className="grid gap-4 xl:grid-cols-2">
        <Surface
          title="Public vacant-houses usage"
          description="External sites should call with a vacant-listings API key only."
        >
          <div className="grid gap-3 p-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Request
              </p>
              <code className="mt-2 block overflow-x-auto text-xs text-slate-900 dark:text-slate-100">
                GET /api/public/vacant-houses
                <br />
                Authorization: Bearer edk_vacant_…
              </code>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Returned fields
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                House number, bedrooms, location, and price only — no tenant PII.
              </p>
            </div>
          </div>
        </Surface>

        <Surface
          title="Webhook / integration readiness"
          description="Providers that commonly involve webhook secrets or payment callbacks."
        >
          <div className="divide-y divide-slate-100 dark:divide-white/10">
            {webhookIntegrations.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.name}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                    {item.nextAction}
                  </p>
                </div>
                <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
              </div>
            ))}
            {webhookIntegrations.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No webhook-related integrations listed.
              </div>
            ) : null}
          </div>
        </Surface>
      </div>

      <Surface
        title="Live tools"
        description="Quick checks against public and health endpoints from this environment."
      >
        <div className="grid gap-3 p-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground">Health probe</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Opens the public health endpoint in a new tab.
            </p>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              GET /api/health
            </a>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-semibold text-foreground">Vacant houses API</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Requires a Bearer key. Create keys under API Keys (super admin), then call:
            </p>
            <code className="mt-2 block overflow-x-auto rounded-lg bg-card px-3 py-2 text-[11px]">
              curl -H &quot;Authorization: Bearer edk_vacant_…&quot; /api/public/vacant-houses
            </code>
          </div>
        </div>
      </Surface>

      <Surface
        title="Recent webhook events"
        description="Sampled inbound webhook outcomes for debugging (M-Pesa and control rejections)."
      >
        <div className="divide-y divide-border">
          {webhookEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  {event.provider} · {event.statusCode}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {event.summary ?? event.path}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(event.createdAt)}
              </p>
            </div>
          ))}
          {webhookEvents.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No webhook samples recorded yet.
            </div>
          ) : null}
        </div>
      </Surface>

      <Surface
        title="Recent API keys"
        description="Ordered by last use. Full create/revoke controls are on the super-admin API Keys page."
      >
        <div className="divide-y divide-slate-100 dark:divide-white/10">
          {recentKeys.map((key) => (
            <div
              key={key.id}
              className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-950 dark:text-white">
                  {key.name}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {key.org.name} · created by {key.createdBy.fullName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Last used {formatDateTime(key.lastUsedAt)} · expires{" "}
                  {formatDateTime(key.expiresAt)}
                </p>
              </div>
              <Badge tone={toneForStatus(key.isActive ? "ACTIVE" : "DISABLED")}>
                {key.isActive ? "ACTIVE" : "REVOKED"}
              </Badge>
            </div>
          ))}
          {recentKeys.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No API keys created yet.
            </div>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}
