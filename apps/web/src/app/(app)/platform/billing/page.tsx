import Link from "next/link";
import { BillingPlan, Prisma, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/db/pagination";
import {
  isTransientDatabaseError,
  retryTransientDatabaseOperation,
} from "@/lib/db/retry";
import { listPendingUpgradeRequests } from "@/lib/billing/upgrade-requests";
import { APP_PLANS } from "@/lib/billing/plans";
import {
  Badge,
  PageHeader,
  PaginationControls,
  StatCard,
  formatDateTime,
  toneForStatus,
} from "../_components/control-plane";
import {
  applyUpgradeRequestAction,
  rejectUpgradeRequestAction,
} from "./actions";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
  status?: string;
  plan?: string;
  ok?: string;
  error?: string;
  message?: string;
}>;

const STATUS_VALUES = Object.values(SubscriptionStatus);
const PLAN_VALUES = Object.values(BillingPlan);

function billingQuery<T>(label: string, operation: () => Promise<T>) {
  return retryTransientDatabaseOperation(operation, {
    attempts: 4,
    delayMs: 650,
    label,
  });
}

function parseStatus(value?: string) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return STATUS_VALUES.find((status) => status === normalized) ?? null;
}

function parsePlan(value?: string) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return PLAN_VALUES.find((plan) => plan === normalized) ?? null;
}

function buildWhere({
  q,
  status,
  plan,
}: {
  q: string;
  status: SubscriptionStatus | null;
  plan: BillingPlan | null;
}): Prisma.SubscriptionWhereInput {
  const where: Prisma.SubscriptionWhereInput = {};

  if (status) where.status = status;
  if (plan) where.plan = plan;

  if (q) {
    where.OR = [
      { billingEmail: { contains: q, mode: "insensitive" } },
      { org: { name: { contains: q, mode: "insensitive" } } },
      { org: { slug: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

/** Stable distinct colors per organization for scannable billing rows. */
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

function colorForOrg(orgId: string, index: number) {
  if (index < ORG_COLOR_PALETTE.length) {
    return ORG_COLOR_PALETTE[index];
  }

  let hash = 0;
  for (let i = 0; i < orgId.length; i += 1) {
    hash = (hash * 31 + orgId.charCodeAt(i)) >>> 0;
  }
  return ORG_COLOR_PALETTE[hash % ORG_COLOR_PALETTE.length];
}

function BillingLoadError({ transient }: { transient: boolean }) {
  return (
    <div className="ed-mobile-first space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Billing"
        title="Subscriptions"
        description="Subscription plans, renewal windows, and recent plan changes with server-side filtering."
      />
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
        <p className="font-semibold">Could not load subscriptions right now</p>
        <p className="mt-1">
          {transient
            ? "The database request timed out or failed temporarily (common on Neon cold starts). Refresh the page in a moment."
            : "The database request failed. Refresh the page, and if it keeps happening check connectivity and the Prisma schema."}
        </p>
      </div>
    </div>
  );
}

export default async function PlatformBillingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = parseStatus(params.status);
  const plan = parsePlan(params.plan);
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 20),
  });
  const where = buildWhere({ q, status, plan });

  let loadResult: {
    subscriptions: Array<{
      id: string;
      plan: BillingPlan;
      status: SubscriptionStatus;
      billingEmail: string | null;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      trialStartsAt: Date | null;
      trialEndsAt: Date | null;
      cancelledAt: Date | null;
      org: { id: string; name: string; slug: string; status: string };
      planChanges: Array<{
        id: string;
        fromPlan: BillingPlan | null;
        toPlan: BillingPlan;
        effectiveFrom: Date;
        reason: string | null;
      }>;
    }>;
    totalFiltered: number;
    total: number;
    active: number;
    trialing: number;
    pastDue: number;
  };

  try {
    loadResult = await billingQuery("platform-billing-subscriptions", async () => {
      const [subscriptions, totalFiltered, total, active, trialing, pastDue] =
        await Promise.all([
          prisma.subscription.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            include: {
              org: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  status: true,
                },
              },
              planChanges: {
                orderBy: { effectiveFrom: "desc" },
                take: 2,
              },
            },
          }),
          prisma.subscription.count({ where }),
          prisma.subscription.count(),
          prisma.subscription.count({ where: { status: "ACTIVE" } }),
          prisma.subscription.count({ where: { status: "TRIALING" } }),
          prisma.subscription.count({ where: { status: "PAST_DUE" } }),
        ]);

      return {
        subscriptions,
        totalFiltered,
        total,
        active,
        trialing,
        pastDue,
      };
    });
  } catch (error) {
    console.error("[PlatformBillingPage] subscription load failed", error);
    return (
      <BillingLoadError transient={isTransientDatabaseError(error)} />
    );
  }

  const { subscriptions, totalFiltered, total, active, trialing, pastDue } =
    loadResult;

  let pendingUpgrades: Awaited<ReturnType<typeof listPendingUpgradeRequests>> =
    [];
  try {
    pendingUpgrades = await billingQuery("platform-billing-upgrade-queue", () =>
      listPendingUpgradeRequests(40),
    );
  } catch (error) {
    console.error("[PlatformBillingPage] upgrade queue load failed", error);
  }

  const orderedOrgIds = Array.from(
    new Set(subscriptions.map((sub) => sub.org.id)),
  );
  const orgColorById = new Map(
    orderedOrgIds.map((orgId, index) => [
      orgId,
      colorForOrg(orgId, index),
    ] as const),
  );

  return (
    <div className="ed-mobile-first space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Billing"
        title="Subscriptions"
        description="Confirm paid upgrade requests, review plan limits, and manage renewal windows. Orgs cannot self-assign paid plans."
      />

      {params.ok === "upgrade-applied" ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-50">
          Upgrade applied. Plan is active and the pending request was cleared.
        </div>
      ) : null}
      {params.ok === "upgrade-rejected" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
          Upgrade request rejected.
        </div>
      ) : null}
      {params.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-50">
          {params.message
            ? decodeURIComponent(params.message)
            : "Could not process that billing action."}
        </div>
      ) : null}

      <section className="ed-keep-cols grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-5">
        <StatCard label="Subscriptions" value={total} />
        <StatCard label="Active" value={active} />
        <StatCard label="Trialing" value={trialing} />
        <StatCard label="Past due" value={pastDue} />
        <StatCard label="Upgrade queue" value={pendingUpgrades.length} />
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-3 py-3 sm:px-4 sm:py-4">
          <h2 className="text-base font-semibold text-foreground">
            Upgrade request queue
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Confirm SaaS payment (M-Pesa/bank ref), then apply the plan. This marks
            the request paid and activates the subscription.
          </p>
        </div>

        {pendingUpgrades.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No pending upgrade requests.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {pendingUpgrades.map(({ subscription, request }) => {
              const listPrice =
                request.amountDue ??
                APP_PLANS[request.plan]?.monthlyAmount ??
                0;

              return (
                <li
                  key={subscription.id}
                  className="space-y-3 px-3 py-3.5 sm:px-4 sm:py-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Link
                        href={`/platform/organizations/${subscription.org.slug}`}
                        className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                      >
                        {subscription.org.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        /{subscription.org.slug} · current{" "}
                        <Badge>{subscription.plan}</Badge> → requested{" "}
                        <Badge
                          tone="border-violet-300 bg-violet-50 text-violet-900"
                        >
                          {request.plan}
                        </Badge>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {request.requestedByName
                          ? `By ${request.requestedByName}`
                          : "Requested"}
                        {request.requestedAt
                          ? ` · ${new Date(request.requestedAt).toLocaleString("en-KE")}`
                          : ""}
                        {listPrice > 0
                          ? ` · KES ${listPrice.toLocaleString("en-KE")}/mo`
                          : " · Custom pricing"}
                      </p>
                      {request.paymentReference ? (
                        <p className="mt-1 text-xs font-medium text-foreground">
                          Payment ref: {request.paymentReference}
                        </p>
                      ) : null}
                      {request.notes ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Notes: {request.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <form
                      action={applyUpgradeRequestAction}
                      className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                    >
                      <input type="hidden" name="orgId" value={subscription.orgId} />
                      <label className="block text-[11px] font-medium text-emerald-900 dark:text-emerald-100">
                        Confirm payment ref
                        <input
                          name="paymentReference"
                          defaultValue={request.paymentReference ?? ""}
                          placeholder="M-Pesa / bank reference"
                          className="mt-1 min-h-9 w-full rounded-lg border border-emerald-200 bg-white px-2 text-sm text-foreground dark:border-emerald-500/30 dark:bg-background"
                        />
                      </label>
                      <label className="block text-[11px] font-medium text-emerald-900 dark:text-emerald-100">
                        Operator notes (optional)
                        <input
                          name="notes"
                          placeholder="Paid, activate PRO"
                          className="mt-1 min-h-9 w-full rounded-lg border border-emerald-200 bg-white px-2 text-sm text-foreground dark:border-emerald-500/30 dark:bg-background"
                        />
                      </label>
                      <button
                        type="submit"
                        className="min-h-9 w-full rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white"
                      >
                        Apply plan (mark paid)
                      </button>
                    </form>

                    <form
                      action={rejectUpgradeRequestAction}
                      className="space-y-2 rounded-xl border border-border bg-muted/20 p-2.5"
                    >
                      <input type="hidden" name="orgId" value={subscription.orgId} />
                      <label className="block text-[11px] font-medium text-muted-foreground">
                        Reject reason (optional)
                        <input
                          name="notes"
                          placeholder="Incomplete payment"
                          className="mt-1 min-h-9 w-full rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                        />
                      </label>
                      <button
                        type="submit"
                        className="min-h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground"
                      >
                        Reject request
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:rounded-[26px]">
        <form className="grid gap-2.5 border-b border-border p-3 sm:gap-3 sm:p-4 lg:grid-cols-[1fr_160px_160px_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search organization or billing email"
            className="min-h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none focus:border-foreground sm:rounded-2xl sm:px-4 sm:py-3"
          />
          <select
            name="plan"
            defaultValue={plan ?? ""}
            className="min-h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium outline-none focus:border-foreground sm:rounded-2xl sm:px-4 sm:py-3"
          >
            <option value="">All plans</option>
            {PLAN_VALUES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="min-h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium outline-none focus:border-foreground sm:rounded-2xl sm:px-4 sm:py-3"
          >
            <option value="">All statuses</option>
            {STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="min-h-11 w-full rounded-xl bg-foreground px-5 text-sm font-semibold text-background sm:rounded-2xl lg:w-auto"
          >
            Apply
          </button>
        </form>

        {subscriptions.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No subscriptions found.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {subscriptions.map((subscription) => {
              const color =
                orgColorById.get(subscription.org.id) ??
                colorForOrg(subscription.org.id, 0);

              return (
                <div
                  key={subscription.id}
                  className={`relative space-y-3 p-3 sm:space-y-4 sm:p-5 ${color.row}`}
                >
                  <span
                    className={`absolute inset-y-0 left-0 w-1 ${color.bar}`}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col gap-3 pl-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <Link
                        href={`/platform/organizations/${subscription.org.slug}`}
                        className="text-base font-semibold text-foreground underline-offset-4 hover:underline"
                      >
                        {subscription.org.name}
                      </Link>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        /{subscription.org.slug}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${color.chip}`}
                      >
                        {subscription.plan}
                      </span>
                      <Badge tone={toneForStatus(subscription.status)}>
                        {subscription.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-2 pl-2 text-sm text-muted-foreground md:grid-cols-3">
                    <p className="min-w-0 break-words">
                      Billing email: {subscription.billingEmail ?? "—"}
                    </p>
                    <p>
                      Period start:{" "}
                      {formatDateTime(subscription.currentPeriodStart)}
                    </p>
                    <p>
                      Period end: {formatDateTime(subscription.currentPeriodEnd)}
                    </p>
                    <p>
                      Trial start: {formatDateTime(subscription.trialStartsAt)}
                    </p>
                    <p>Trial end: {formatDateTime(subscription.trialEndsAt)}</p>
                    <p>
                      Cancelled at: {formatDateTime(subscription.cancelledAt)}
                    </p>
                  </div>

                  {subscription.planChanges.length > 0 ? (
                    <div className="grid gap-2 pl-2 md:grid-cols-2">
                      {subscription.planChanges.map((change) => (
                        <div
                          key={change.id}
                          className="rounded-xl border border-border bg-background/70 p-3 text-sm sm:rounded-2xl"
                        >
                          <span className="font-medium text-foreground">
                            {change.fromPlan ?? "—"} to {change.toPlan}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {formatDateTime(change.effectiveFrom)}
                          </span>
                          {change.reason ? (
                            <p className="mt-1 text-muted-foreground">
                              {change.reason}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={totalFiltered}
          basePath="/platform/billing"
          query={{ q, status, plan }}
        />
      </section>
    </div>
  );
}
