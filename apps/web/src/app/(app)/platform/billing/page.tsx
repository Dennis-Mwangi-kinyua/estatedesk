import { requirePlatformRole } from "@/lib/permissions/guards";
import { OrganizationBillingCard } from "../_components/organization-billing-card";
import Link from "@/components/navigation/workspace-link";
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
  upgrades?: string;
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

function BillingLoadError({ transient }: { transient: boolean }) {
  return (
    <div className="ed-mobile-first space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Billing"
        title="Organization billing"
        description="Subscription plans, renewal windows, and recent plan changes with server-side filtering."
      />
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
        <p className="font-semibold">Could not load subscriptions right now</p>
        <p className="mt-1">
          {transient
            ? "Billing is temporarily unavailable. Refresh in a moment."
            : "Billing could not be loaded. Refresh the page or contact platform support if the problem continues."}
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
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
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

  return (
    <div className="ed-mobile-first space-y-4 sm:space-y-5">
      <PageHeader
        eyebrow="Billing"
        title="Organization billing"
        description="Open an organization card to review its subscription, manage renewals, and generate invoices. Filter by organization, plan, or subscription status."
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
            ? params.message
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

      <details id="upgrade-requests" open={!!params.error || !!params.ok || params.upgrades === "open"} className="rounded-2xl border border-border bg-card">
        <summary className="cursor-pointer px-4 py-4 text-sm font-semibold">Upgrade requests ({pendingUpgrades.length}) · Review payments and plan changes</summary>
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
                        href={`/platform/billing/${subscription.org.id}`}
                        className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                      >
                        {subscription.org.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        /{subscription.org.slug} · current{" "}
                        <Badge>{subscription.plan}</Badge> → requested{" "}
                        <Badge
                          tone="border-teal-300 bg-teal-50 text-teal-900"
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
                      <button data-workspace-action="true"
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
                      <button data-workspace-action="true"
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
      </details>

      <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:rounded-[26px]">
        <form className="grid gap-2.5 border-b border-border p-3 sm:gap-3 sm:p-4 lg:grid-cols-[1fr_160px_160px_auto]">
          <input
            name="q"
            aria-label="Search organization or billing email"
            defaultValue={q}
            placeholder="Search organization or billing email"
            className="min-h-11 w-full rounded-xl border border-border bg-muted/40 px-3 text-sm outline-none focus:border-foreground sm:rounded-2xl sm:px-4 sm:py-3"
          />
          <select
            name="plan"
            aria-label="Subscription plan"
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
            aria-label="Subscription status"
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
          <button data-workspace-action="true"
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
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">
            {subscriptions.map(subscription => <OrganizationBillingCard key={subscription.id} subscription={{organizationId:subscription.org.id,organizationName:subscription.org.name,plan:APP_PLANS[subscription.plan].name,status:subscription.status,billingEmail:subscription.billingEmail,periodEnd:subscription.currentPeriodEnd}} />)}
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
