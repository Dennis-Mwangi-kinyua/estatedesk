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

const RATE_COLOR_PALETTE = [
  { card: "bg-sky-50/80 dark:bg-sky-500/10", row: "bg-sky-50/80 dark:bg-sky-500/10", bar: "bg-sky-500" },
  { card: "bg-emerald-50/80 dark:bg-emerald-500/10", row: "bg-emerald-50/80 dark:bg-emerald-500/10", bar: "bg-emerald-500" },
  { card: "bg-violet-50/80 dark:bg-violet-500/10", row: "bg-violet-50/80 dark:bg-violet-500/10", bar: "bg-violet-500" },
  { card: "bg-amber-50/80 dark:bg-amber-500/10", row: "bg-amber-50/80 dark:bg-amber-500/10", bar: "bg-amber-500" },
  { card: "bg-rose-50/80 dark:bg-rose-500/10", row: "bg-rose-50/80 dark:bg-rose-500/10", bar: "bg-rose-500" },
  { card: "bg-cyan-50/80 dark:bg-cyan-500/10", row: "bg-cyan-50/80 dark:bg-cyan-500/10", bar: "bg-cyan-500" },
  { card: "bg-indigo-50/80 dark:bg-indigo-500/10", row: "bg-indigo-50/80 dark:bg-indigo-500/10", bar: "bg-indigo-500" },
  { card: "bg-orange-50/80 dark:bg-orange-500/10", row: "bg-orange-50/80 dark:bg-orange-500/10", bar: "bg-orange-500" },
] as const;

function colorForRate(key: string) {
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return RATE_COLOR_PALETTE[hash % RATE_COLOR_PALETTE.length];
}

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
    <div className="min-w-0 max-w-full space-y-6 overflow-x-clip">
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
        <div className="min-w-0 divide-y divide-border 2xl:hidden">
          {policies.map((policy) => {
            const color = colorForRate(policy.name);
            return (
            <article key={policy.name} className={`relative space-y-2.5 overflow-hidden py-3.5 pl-5 pr-3 sm:pr-4 ${color.card}`}>
              <span className={`absolute inset-y-0 left-0 w-1 ${color.bar}`} aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <h3 className="break-words text-sm font-semibold leading-5 text-foreground">
                  {policy.name}
                </h3>
                <Badge>{policy.backing}</Badge>
              </div>
              <dl className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Scope</dt>
                  <dd className="mt-0.5 break-words font-semibold text-foreground">
                    {policy.scope}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Limit</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{policy.limit}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted-foreground">Window</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{policy.window}</dd>
                </div>
              </dl>
            </article>
            );
          })}
        </div>

        <div className="hidden max-w-full overflow-x-auto 2xl:block">
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
              {policies.map((policy) => {
                const color = colorForRate(policy.name);
                return (
                <tr key={policy.name} className={`border-t border-neutral-100 dark:border-white/10 ${color.row}`}>
                  <td className="relative px-5 py-3 font-medium text-slate-950 dark:text-white">
                    <span className={`absolute inset-y-2 left-1.5 w-1 rounded-full ${color.bar}`} aria-hidden="true" />
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
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface title="Bucket scopes">
        <div className="min-w-0 divide-y divide-border 2xl:hidden">
          {groupedScopes.map((scope) => {
            const color = colorForRate(scope.scope);
            return (
            <article key={scope.scope} className={`relative space-y-3 overflow-hidden py-3.5 pl-5 pr-3 sm:pr-4 ${color.card}`}>
              <span className={`absolute inset-y-0 left-0 w-1 ${color.bar}`} aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <h3 className="break-words text-sm font-semibold leading-5 text-foreground">
                  {scope.scope}
                </h3>
                <Badge>{formatNumber(scope.totalHits)} hits</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-2.5 text-xs">
                <div>
                  <dt className="text-muted-foreground">Buckets</dt>
                  <dd className="font-semibold text-foreground">{formatNumber(scope.buckets)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Active</dt>
                  <dd className="font-semibold text-foreground">{formatNumber(scope.active)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Latest activity</dt>
                  <dd className="font-semibold text-foreground">{formatDateTime(scope.latest)}</dd>
                </div>
              </dl>
              {canMutate ? (
                <form action={clearRateLimitScopeAction}>
                  <input type="hidden" name="scope" value={scope.scope} />
                  <button
                    type="submit"
                    className="min-h-11 w-full rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                  >
                    Clear scope
                  </button>
                </form>
              ) : null}
            </article>
            );
          })}
          {groupedScopes.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No persistent rate-limit buckets found.
            </p>
          ) : null}
        </div>

        <div className="hidden max-w-full overflow-x-auto 2xl:block">
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
              {groupedScopes.map((scope) => {
                const color = colorForRate(scope.scope);
                return (
                <tr key={scope.scope} className={`border-t border-neutral-100 dark:border-white/10 ${color.row}`}>
                  <td className="relative px-5 py-3 font-medium text-slate-950 dark:text-white">
                    <span className={`absolute inset-y-2 left-1.5 w-1 rounded-full ${color.bar}`} aria-hidden="true" />
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
                );
              })}
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
        <div className="min-w-0 divide-y divide-border 2xl:hidden">
          {topBuckets.map((bucket) => {
            const color = colorForRate(bucket.key);
            return (
            <article key={bucket.key} className={`relative space-y-3 overflow-hidden py-3.5 pl-5 pr-3 sm:pr-4 ${color.card}`}>
              <span className={`absolute inset-y-0 left-0 w-1 ${color.bar}`} aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {bucketScope(bucket.key)}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-foreground">
                    {bucket.key}
                  </p>
                </div>
                <Badge tone={bucketTone(bucket.resetAt)}>
                  {bucketStatus(bucket.resetAt)}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                  <dt className="text-muted-foreground">Count</dt>
                  <dd className="font-semibold text-foreground">{formatNumber(bucket.count)}</dd>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-2.5">
                  <dt className="text-muted-foreground">Resets</dt>
                  <dd className="font-semibold text-foreground">{formatDateTime(bucket.resetAt)}</dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                Updated {formatDateTime(bucket.updatedAt)}
              </p>
              {canMutate ? (
                <form action={resetRateLimitBucketAction}>
                  <input type="hidden" name="key" value={bucket.key} />
                  <button
                    type="submit"
                    className="min-h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted/50"
                  >
                    Reset bucket
                  </button>
                </form>
              ) : null}
            </article>
            );
          })}
          {topBuckets.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No rate-limit activity found.
            </p>
          ) : null}
        </div>

        <div className="hidden max-w-full overflow-x-auto 2xl:block">
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
              {topBuckets.map((bucket) => {
                const color = colorForRate(bucket.key);
                return (
                <tr
                  key={bucket.key}
                  className={`border-t border-neutral-100 align-top dark:border-white/10 ${color.row}`}
                >
                  <td className="relative max-w-md px-5 py-3">
                    <span className={`absolute inset-y-2 left-1.5 w-1 rounded-full ${color.bar}`} aria-hidden="true" />
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
                );
              })}
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
