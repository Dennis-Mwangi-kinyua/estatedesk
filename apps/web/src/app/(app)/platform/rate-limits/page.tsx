import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  formatNumber,
} from "../_components/control-plane";
import {
  clearExpiredRateLimitBucketsAction,
  clearRateLimitScopeAction,
  resetRateLimitBucketAction,
} from "./actions";

export const dynamic = "force-dynamic";

type RateLimitPolicy = {
  name: string;
  scope: string;
  limit: string;
  window: string;
  backing: string;
};

const policies: RateLimitPolicy[] = [
  {
    name: "Login attempts",
    scope: "IP + identifier",
    limit: "8 requests",
    window: "60 seconds",
    backing: "Database bucket",
  },
  {
    name: "Registration requests",
    scope: "IP + submitted email",
    limit: "Configured in action",
    window: "Short window",
    backing: "Database bucket",
  },
  {
    name: "Contact requests",
    scope: "IP + submitted email",
    limit: "Configured in action",
    window: "Short window",
    backing: "Database bucket",
  },
  {
    name: "Public vacant houses API",
    scope: "Bearer token hash or IP",
    limit: "60 requests",
    window: "60 seconds",
    backing: "Database bucket",
  },
  {
    name: "Vacancy OG image API",
    scope: "IP",
    limit: "120 requests",
    window: "60 seconds",
    backing: "Database bucket",
  },
  {
    name: "Tenant admin actions",
    scope: "Org + user + tenant + action",
    limit: "5 requests",
    window: "60 seconds",
    backing: "Database bucket",
  },
  {
    name: "Tenant page proxy",
    scope: "IP + path",
    limit: "30 requests",
    window: "60 seconds",
    backing: "In-memory proxy",
  },
];

function rateLimitQuery<T>(label: string, operation: () => Promise<T>) {
  return retryTransientDatabaseOperation(operation, {
    attempts: 3,
    delayMs: 500,
    label,
  });
}

function bucketScope(key: string) {
  return key.split(":")[0] || "unknown";
}

function bucketTone(resetAt: Date) {
  if (resetAt.getTime() > Date.now()) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100";
  }

  return "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";
}

function bucketStatus(resetAt: Date) {
  return resetAt.getTime() > Date.now() ? "ACTIVE" : "EXPIRED";
}

export default async function PlatformRateLimitsPage() {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const canMutate = session.platformRole === "SUPER_ADMIN";

  const now = new Date();
  const [totalBuckets, activeBuckets, expiredBuckets, topBuckets, scopes] =
    await Promise.all([
      rateLimitQuery("rate-limits-total", () => prisma.rateLimitBucket.count()),
      rateLimitQuery("rate-limits-active", () =>
        prisma.rateLimitBucket.count({ where: { resetAt: { gt: now } } }),
      ),
      rateLimitQuery("rate-limits-expired", () =>
        prisma.rateLimitBucket.count({ where: { resetAt: { lte: now } } }),
      ),
      rateLimitQuery("rate-limits-top-buckets", () =>
        prisma.rateLimitBucket.findMany({
          orderBy: [{ count: "desc" }, { updatedAt: "desc" }],
          take: 20,
        }),
      ),
      rateLimitQuery("rate-limits-scopes", () =>
        prisma.rateLimitBucket.findMany({
          select: {
            key: true,
            count: true,
            resetAt: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 200,
        }),
      ),
    ]);

  const groupedScopes = Array.from(
    scopes
      .reduce(
        (map, bucket) => {
          const scope = bucketScope(bucket.key);
          const current = map.get(scope) ?? {
            scope,
            buckets: 0,
            active: 0,
            totalHits: 0,
            latest: null as Date | null,
          };

          current.buckets += 1;
          current.totalHits += bucket.count;
          if (bucket.resetAt > now) current.active += 1;
          if (!current.latest || bucket.updatedAt > current.latest) {
            current.latest = bucket.updatedAt;
          }

          map.set(scope, current);
          return map;
        },
        new Map<
          string,
          {
            scope: string;
            buckets: number;
            active: number;
            totalHits: number;
            latest: Date | null;
          }
        >(),
      )
      .values(),
  ).sort((a, b) => b.totalHits - a.totalHits);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Developer portal"
        title="Rate limits"
        description="Live visibility into persistent rate-limit buckets plus super-admin ops to reset individual keys, clear a scope, or purge expired windows."
        action={
          canMutate ? (
            <form action={clearExpiredRateLimitBucketsAction}>
              <button
                type="submit"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50"
              >
                Clear expired buckets
              </button>
            </form>
          ) : undefined
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tracked buckets" value={formatNumber(totalBuckets)} />
        <StatCard label="Active windows" value={formatNumber(activeBuckets)} />
        <StatCard label="Expired windows" value={formatNumber(expiredBuckets)} />
        <StatCard label="Configured policies" value={formatNumber(policies.length)} />
      </section>

      {!canMutate ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
          Bucket reset and scope clear actions require a super admin. You can still
          inspect live activity.
        </div>
      ) : null}

      <Surface
        title="Configured policies"
        description="Current application-level throttles. Database-backed buckets persist across requests; proxy buckets are process-local."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Policy</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">Limit</th>
                <th className="px-4 py-3 font-medium">Window</th>
                <th className="px-4 py-3 font-medium">Backing</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.name} className="border-t border-neutral-100 dark:border-white/10">
                  <td className="px-4 py-3 font-medium text-slate-950 dark:text-white">
                    {policy.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {policy.scope}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {policy.limit}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {policy.window}
                  </td>
                  <td className="px-4 py-3">
                    <Badge>{policy.backing}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface title="Bucket scopes">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">Buckets</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 font-medium">Recorded hits</th>
                <th className="px-4 py-3 font-medium">Latest activity</th>
                {canMutate ? (
                  <th className="px-4 py-3 font-medium">Ops</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {groupedScopes.map((scope) => (
                <tr key={scope.scope} className="border-t border-neutral-100 dark:border-white/10">
                  <td className="px-4 py-3 font-medium text-slate-950 dark:text-white">
                    {scope.scope}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatNumber(scope.buckets)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatNumber(scope.active)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatNumber(scope.totalHits)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDateTime(scope.latest)}
                  </td>
                  {canMutate ? (
                    <td className="px-4 py-3">
                      <form action={clearRateLimitScopeAction}>
                        <input type="hidden" name="scope" value={scope.scope} />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-500/30 dark:bg-slate-950 dark:text-red-300"
                        >
                          Clear scope
                        </button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
              {groupedScopes.length === 0 ? (
                <EmptyRow
                  colSpan={canMutate ? 6 : 5}
                  label="No persistent rate-limit buckets found."
                />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface
        title="Hottest buckets"
        description="Highest-count persistent buckets. Super admins can reset a bucket to immediately unthrottle a client."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500 dark:bg-slate-900 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">Bucket</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">Count</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reset</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                {canMutate ? (
                  <th className="px-4 py-3 font-medium">Ops</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {topBuckets.map((bucket) => (
                <tr
                  key={bucket.key}
                  className="border-t border-neutral-100 align-top dark:border-white/10"
                >
                  <td className="max-w-md px-4 py-3">
                    <p className="break-all font-mono text-xs text-slate-700 dark:text-slate-200">
                      {bucket.key}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {bucketScope(bucket.key)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatNumber(bucket.count)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={bucketTone(bucket.resetAt)}>
                      {bucketStatus(bucket.resetAt)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDateTime(bucket.resetAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDateTime(bucket.updatedAt)}
                  </td>
                  {canMutate ? (
                    <td className="px-4 py-3">
                      <form action={resetRateLimitBucketAction}>
                        <input type="hidden" name="key" value={bucket.key} />
                        <button
                          type="submit"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100"
                        >
                          Reset
                        </button>
                      </form>
                    </td>
                  ) : null}
                </tr>
              ))}
              {topBuckets.length === 0 ? (
                <EmptyRow
                  colSpan={canMutate ? 7 : 6}
                  label="No rate-limit activity found."
                />
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
