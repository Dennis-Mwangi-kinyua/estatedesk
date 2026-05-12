import Link from "next/link";
import { BillingPlan, Prisma, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPagination } from "@/lib/db/pagination";
import {
  Badge,
  PageHeader,
  PaginationControls,
  StatCard,
  formatDateTime,
  toneForStatus,
} from "../_components/control-plane";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
  q?: string;
  status?: string;
  plan?: string;
}>;

const STATUS_VALUES = Object.values(SubscriptionStatus);
const PLAN_VALUES = Object.values(BillingPlan);

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

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Billing"
        title="Subscriptions"
        description="Subscription plans, renewal windows, and recent plan changes with server-side filtering."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Subscriptions" value={total} />
        <StatCard label="Active" value={active} />
        <StatCard label="Trialing" value={trialing} />
        <StatCard label="Past due" value={pastDue} />
      </section>

      <section className="overflow-hidden rounded-[26px] border border-neutral-200 bg-white shadow-sm">
        <form className="grid gap-3 border-b border-neutral-200 p-4 lg:grid-cols-[1fr_160px_160px_auto]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search organization or billing email"
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none"
          />
          <select
            name="plan"
            defaultValue={plan ?? ""}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium outline-none"
          >
            <option value="">All plans</option>
            {PLAN_VALUES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium outline-none"
          >
            <option value="">All statuses</option>
            {STATUS_VALUES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <button className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white">
            Apply
          </button>
        </form>

        {subscriptions.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            No subscriptions found.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      href={`/platform/organizations/${subscription.org.slug}`}
                      className="text-base font-semibold text-neutral-950 underline-offset-4 hover:underline"
                    >
                      {subscription.org.name}
                    </Link>
                    <p className="mt-1 text-sm text-neutral-500">/{subscription.org.slug}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{subscription.plan}</Badge>
                    <Badge tone={toneForStatus(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-neutral-600 md:grid-cols-3">
                  <p>Billing email: {subscription.billingEmail ?? "-"}</p>
                  <p>Period start: {formatDateTime(subscription.currentPeriodStart)}</p>
                  <p>Period end: {formatDateTime(subscription.currentPeriodEnd)}</p>
                  <p>Trial start: {formatDateTime(subscription.trialStartsAt)}</p>
                  <p>Trial end: {formatDateTime(subscription.trialEndsAt)}</p>
                  <p>Cancelled at: {formatDateTime(subscription.cancelledAt)}</p>
                </div>

                {subscription.planChanges.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {subscription.planChanges.map((change) => (
                      <div key={change.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm">
                        <span className="font-medium text-neutral-950">
                          {change.fromPlan ?? "-"} to {change.toPlan}
                        </span>
                        <span className="ml-2 text-neutral-500">
                          {formatDateTime(change.effectiveFrom)}
                        </span>
                        {change.reason ? (
                          <p className="mt-1 text-neutral-500">{change.reason}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
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
