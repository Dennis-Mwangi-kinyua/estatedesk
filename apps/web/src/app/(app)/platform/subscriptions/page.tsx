import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  isTransientDatabaseError,
  retryTransientDatabaseOperation,
} from "@/lib/db/retry";
import {
  AdminLink,
  Badge,
  EmptyRow,
  PageHeader,
  StatCard,
  Surface,
  formatDateTime,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

/** Stable, distinct row tints so orgs are easy to scan apart. */
const ORG_COLOR_PALETTE = [
  {
    row: "bg-sky-50/90 dark:bg-sky-500/10",
    bar: "bg-sky-500",
    chip: "border-sky-200 bg-sky-100 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-100",
  },
  {
    row: "bg-emerald-50/90 dark:bg-emerald-500/10",
    bar: "bg-emerald-500",
    chip: "border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100",
  },
  {
    row: "bg-violet-50/90 dark:bg-violet-500/10",
    bar: "bg-violet-500",
    chip: "border-violet-200 bg-violet-100 text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-100",
  },
  {
    row: "bg-amber-50/90 dark:bg-amber-500/10",
    bar: "bg-amber-500",
    chip: "border-amber-200 bg-amber-100 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100",
  },
  {
    row: "bg-rose-50/90 dark:bg-rose-500/10",
    bar: "bg-rose-500",
    chip: "border-rose-200 bg-rose-100 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100",
  },
  {
    row: "bg-cyan-50/90 dark:bg-cyan-500/10",
    bar: "bg-cyan-500",
    chip: "border-cyan-200 bg-cyan-100 text-cyan-900 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-100",
  },
  {
    row: "bg-indigo-50/90 dark:bg-indigo-500/10",
    bar: "bg-indigo-500",
    chip: "border-indigo-200 bg-indigo-100 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-100",
  },
  {
    row: "bg-fuchsia-50/90 dark:bg-fuchsia-500/10",
    bar: "bg-fuchsia-500",
    chip: "border-fuchsia-200 bg-fuchsia-100 text-fuchsia-900 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/15 dark:text-fuchsia-100",
  },
  {
    row: "bg-teal-50/90 dark:bg-teal-500/10",
    bar: "bg-teal-500",
    chip: "border-teal-200 bg-teal-100 text-teal-900 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-100",
  },
  {
    row: "bg-orange-50/90 dark:bg-orange-500/10",
    bar: "bg-orange-500",
    chip: "border-orange-200 bg-orange-100 text-orange-950 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-100",
  },
  {
    row: "bg-lime-50/90 dark:bg-lime-500/10",
    bar: "bg-lime-500",
    chip: "border-lime-200 bg-lime-100 text-lime-950 dark:border-lime-500/30 dark:bg-lime-500/15 dark:text-lime-100",
  },
  {
    row: "bg-pink-50/90 dark:bg-pink-500/10",
    bar: "bg-pink-500",
    chip: "border-pink-200 bg-pink-100 text-pink-900 dark:border-pink-500/30 dark:bg-pink-500/15 dark:text-pink-100",
  },
] as const;

function orgColorIndex(orgId: string) {
  let hash = 0;
  for (let i = 0; i < orgId.length; i += 1) {
    hash = (hash * 31 + orgId.charCodeAt(i)) >>> 0;
  }
  return hash % ORG_COLOR_PALETTE.length;
}

function colorForOrg(orgId: string) {
  return ORG_COLOR_PALETTE[orgColorIndex(orgId)];
}

export default async function SubscriptionToolsPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const loadResult = await retryTransientDatabaseOperation(
    () =>
      prisma.subscription.findMany({
        orderBy: [{ status: "asc" }, { currentPeriodEnd: "asc" }],
        include: {
          org: {
            select: { id: true, name: true, slug: true, status: true },
          },
          planChanges: { orderBy: { effectiveFrom: "desc" }, take: 1 },
        },
      }),
    {
      label: "platform-subscriptions-find-many",
      attempts: 4,
      delayMs: 650,
    },
  ).then(
    (subscriptions) => ({ ok: true as const, subscriptions }),
    (error: unknown) => ({ ok: false as const, error }),
  );

  if (!loadResult.ok) {
    console.error("[SubscriptionToolsPage] load failed", loadResult.error);
    return (
      <div className="ed-mobile-first space-y-4 sm:space-y-5">
        <PageHeader
          eyebrow="Subscription controls"
          title="Plan enforcement"
          description="Subscription operations view for renewals, trials, past-due plans, and plan-change history."
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
          <p className="font-semibold">Could not load plan enforcement queue</p>
          <p className="mt-1">
            {isTransientDatabaseError(loadResult.error)
              ? "The database request timed out temporarily. Refresh the page in a moment."
              : "The database request failed. Refresh the page and check connectivity if it persists."}
          </p>
        </div>
      </div>
    );
  }

  const subscriptions = loadResult.subscriptions;

  const now = new Date();
  const expiringSoon = subscriptions.filter((sub) => {
    const days =
      (sub.currentPeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
    return days >= 0 && days <= 14;
  });

  // Assign sequential palette slots first so adjacent orgs differ even when hashes collide.
  const orderedOrgIds = Array.from(
    new Set(subscriptions.map((sub) => sub.org.id)),
  );
  const orgColorById = new Map(
    orderedOrgIds.map((orgId, index) => {
      // Prefer sequential uniqueness; fall back to stable hash when palette wraps.
      const color =
        index < ORG_COLOR_PALETTE.length
          ? ORG_COLOR_PALETTE[index]
          : colorForOrg(orgId);
      return [orgId, color] as const;
    }),
  );

  return (
    <div className="ed-mobile-first min-w-0 max-w-full space-y-4 overflow-x-clip sm:space-y-5 lg:space-y-6">
      <PageHeader
        eyebrow="Subscription controls"
        title="Plan enforcement"
        description="Subscription operations view for renewals, trials, past-due plans, and plan-change history."
      />

      <section className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
        <StatCard label="Subscriptions" value={subscriptions.length} />
        <StatCard
          label="Active"
          value={subscriptions.filter((s) => s.status === "ACTIVE").length}
        />
        <StatCard
          label="Past due"
          value={subscriptions.filter((s) => s.status === "PAST_DUE").length}
        />
        <StatCard label="Ending in 14 days" value={expiringSoon.length} />
      </section>

      <Surface
        title="Plan enforcement queue"
        description="Each organization uses a distinct color band for quick scanning."
      >
        {subscriptions.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No subscriptions found.
          </div>
        ) : (
          <>
            {/* Mobile cards with org color accent */}
            <ul className="min-w-0 divide-y divide-border 2xl:hidden">
              {subscriptions.map((sub) => {
                const color =
                  orgColorById.get(sub.org.id) ?? colorForOrg(sub.org.id);

                return (
                  <li key={sub.id} className={`relative ${color.row}`}>
                    <span
                      className={`absolute inset-y-0 left-0 w-1 ${color.bar}`}
                      aria-hidden="true"
                    />
                    <div className="space-y-2.5 py-3.5 pl-4 pr-3 sm:px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <AdminLink
                            href={`/platform/organizations/${sub.org.slug}`}
                          >
                            <span className="block break-words text-sm font-semibold leading-5">
                              {sub.org.name}
                            </span>
                          </AdminLink>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            /{sub.org.slug}
                          </p>
                        </div>
                        <Badge tone={toneForStatus(sub.status)}>
                          {sub.status}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${color.chip}`}
                        >
                          {sub.plan}
                        </span>
                        <span className="inline-flex rounded-full border border-border bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          Ends {formatDateTime(sub.currentPeriodEnd)}
                        </span>
                      </div>

                      <dl className="grid grid-cols-1 gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
                        <div className="flex justify-between gap-2">
                          <dt>Trial end</dt>
                          <dd className="min-w-0 break-words text-right font-medium text-foreground">
                            {formatDateTime(sub.trialEndsAt)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Billing email</dt>
                          <dd className="min-w-0 truncate font-medium text-foreground">
                            {sub.billingEmail ?? "—"}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Latest change</dt>
                          <dd className="min-w-0 truncate text-right font-medium text-foreground">
                            {sub.planChanges[0]
                              ? `${sub.planChanges[0].fromPlan ?? "—"} → ${sub.planChanges[0].toPlan}`
                              : "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Desktop table with per-org row colors */}
            <div className="hidden max-w-full overflow-x-auto 2xl:block">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40 text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Organization</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Period end</th>
                    <th className="px-4 py-3 font-medium">Trial end</th>
                    <th className="px-4 py-3 font-medium">Billing email</th>
                    <th className="px-4 py-3 font-medium">Latest change</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => {
                    const color =
                      orgColorById.get(sub.org.id) ?? colorForOrg(sub.org.id);

                    return (
                      <tr
                        key={sub.id}
                        className={`border-t border-border/80 ${color.row}`}
                      >
                        <td className="relative px-4 py-3">
                          <span
                            className={`absolute inset-y-2 left-1.5 w-1 rounded-full ${color.bar}`}
                            aria-hidden="true"
                          />
                          <div className="pl-2">
                            <AdminLink
                              href={`/platform/organizations/${sub.org.slug}`}
                            >
                              {sub.org.name}
                            </AdminLink>
                            <p className="mt-1 text-xs text-muted-foreground">
                              /{sub.org.slug}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${color.chip}`}
                          >
                            {sub.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={toneForStatus(sub.status)}>
                            {sub.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateTime(sub.currentPeriodEnd)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateTime(sub.trialEndsAt)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {sub.billingEmail ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {sub.planChanges[0]
                            ? `${sub.planChanges[0].fromPlan ?? "—"} → ${sub.planChanges[0].toPlan}`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {subscriptions.length === 0 ? (
                    <EmptyRow colSpan={7} label="No subscriptions found." />
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Surface>
    </div>
  );
}
