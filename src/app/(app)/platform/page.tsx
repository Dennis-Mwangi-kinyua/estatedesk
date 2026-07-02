import Link from "next/link";
import type { ComponentType } from "react";
import { Bell, Clock3, CreditCard, ExternalLink, FileClock, Mail, Phone, Plus, SlidersHorizontal, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { countOnlineUsers } from "@/lib/auth/presence";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { OnboardingRequestPopup } from "./_components/onboarding-request-popup";

export const dynamic = "force-dynamic";

type TrendPoint = {
  label: string;
  value: number;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

function formatCurrency(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(value);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short" }).format(date);
}

function calcTrend(current: number, previous: number) {
  if (previous <= 0 && current > 0) return "+100%";
  if (previous <= 0) return "0%";
  const change = ((current - previous) / previous) * 100;
  const prefix = change >= 0 ? "+" : "";
  return `${prefix}${change.toFixed(1)}%`;
}

function trendTone(current: number, previous: number) {
  if (current > previous) return "text-emerald-600 dark:text-emerald-300";
  if (current < previous) return "text-rose-600 dark:text-rose-300";
  return "text-slate-500 dark:text-slate-400";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function statusTone(status: string | null | undefined) {
  const value = (status ?? "").toLowerCase();

  if (
    ["active", "paid", "paid_verified", "verified", "success", "enabled"].includes(
      value,
    )
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-100";
  }

  if (
    [
      "trialing",
      "pending",
      "draft",
      "processing",
      "payment_pending",
      "issued",
      "partial",
    ].includes(value)
  ) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100";
  }

  if (
    [
      "cancelled",
      "canceled",
      "expired",
      "failed",
      "rejected",
      "overdue",
      "past_due",
      "inactive",
    ].includes(value)
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-300/30 dark:bg-rose-300/10 dark:text-rose-100";
  }

  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200";
}

function buildBars(values: number[]) {
  const max = Math.max(...values, 1);
  return values.map((value, index) => ({
    id: index,
    value,
    height: Math.max(14, Math.round((value / max) * 100)),
  }));
}

function platformQuery<T>(label: string, operation: () => Promise<T>) {
  return retryTransientDatabaseOperation(operation, {
    attempts: 3,
    delayMs: 400,
    label,
  });
}

async function getOrganizationSeries(months = 6): Promise<TrendPoint[]> {
  const now = new Date();
  const monthStarts = Array.from({ length: months }, (_, i) =>
    startOfMonth(addMonths(now, -(months - 1) + i)),
  );

  const results = await Promise.all(
    monthStarts.map(async (monthStart) => {
      const nextMonth = addMonths(monthStart, 1);

      const value = await platformQuery("platform-org-series", () =>
        prisma.organization.count({
          where: {
            deletedAt: null,
            createdAt: {
              gte: monthStart,
              lt: nextMonth,
            },
          },
        }),
      );

      return {
        label: monthLabel(monthStart),
        value,
      };
    }),
  );

  return results;
}

async function getRevenueSeries(months = 6): Promise<TrendPoint[]> {
  const now = new Date();
  const monthStarts = Array.from({ length: months }, (_, i) =>
    startOfMonth(addMonths(now, -(months - 1) + i)),
  );

  const results = await Promise.all(
    monthStarts.map(async (monthStart) => {
      const nextMonth = addMonths(monthStart, 1);

      const agg = await platformQuery("platform-revenue-series", () =>
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            paidAt: {
              gte: monthStart,
              lt: nextMonth,
            },
            verificationStatus: "VERIFIED",
          },
        }),
      );

      return {
        label: monthLabel(monthStart),
        value: Number(agg._sum.amount ?? 0),
      };
    }),
  );

  return results;
}

export default async function PlatformPage() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const previousMonthStart = addMonths(currentMonthStart, -1);
  const nextMonthStart = addMonths(currentMonthStart, 1);

  const [
    totalUsers,
    onlineUsers,
    totalRootAdmins,
    totalPlatformAdmins,
    totalOrganizations,
    totalProperties,
    totalUnits,
    totalTenants,
    totalLeases,
    totalSubscriptions,
    totalPayments,
    totalAuditLogs,
    currentMonthOrgCount,
    previousMonthOrgCount,
    currentRevenueAgg,
    previousRevenueAgg,
    verifiedPayments,
    pendingPayments,
    failedPayments,
    activeSubscriptions,
    trialSubscriptions,
    atRiskSubscriptions,
    recentOrganizations,
    recentPayments,
    newOnboardingCount,
    recentOnboardingRequests,
    organizationSeries,
    revenueSeries,
  ] = await Promise.all([
    platformQuery("platform-total-users", () =>
      prisma.user.count({ where: { deletedAt: null } }),
    ),
    platformQuery("platform-online-users", () => countOnlineUsers(now)),
    platformQuery("platform-root-admins", () => prisma.user.count({
      where: {
        deletedAt: null,
        isRootSuperAdmin: true,
      },
    })),
    platformQuery("platform-admins", () => prisma.user.count({
      where: {
        deletedAt: null,
        OR: [{ platformRole: "SUPER_ADMIN" }, { platformRole: "PLATFORM_ADMIN" }],
      },
    })),
    platformQuery("platform-total-organizations", () =>
      prisma.organization.count({ where: { deletedAt: null } }),
    ),
    platformQuery("platform-total-properties", () =>
      prisma.property.count({ where: { deletedAt: null } }),
    ),
    platformQuery("platform-total-units", () =>
      prisma.unit.count({ where: { deletedAt: null } }),
    ),
    platformQuery("platform-total-tenants", () =>
      prisma.tenant.count({ where: { deletedAt: null } }),
    ),
    platformQuery("platform-total-leases", () =>
      prisma.lease.count({ where: { deletedAt: null } }),
    ),
    platformQuery("platform-total-subscriptions", () => prisma.subscription.count()),
    platformQuery("platform-total-payments", () => prisma.payment.count()),
    platformQuery("platform-total-audit-logs", () => prisma.auditLog.count()),

    platformQuery("platform-current-month-orgs", () => prisma.organization.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
      },
    })),
    platformQuery("platform-previous-month-orgs", () => prisma.organization.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: previousMonthStart,
          lt: currentMonthStart,
        },
      },
    })),

    platformQuery("platform-current-revenue", () => prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paidAt: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
        verificationStatus: "VERIFIED",
      },
    })),
    platformQuery("platform-previous-revenue", () => prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paidAt: {
          gte: previousMonthStart,
          lt: currentMonthStart,
        },
        verificationStatus: "VERIFIED",
      },
    })),

    platformQuery("platform-verified-payments", () => prisma.payment.count({
      where: { verificationStatus: "VERIFIED" },
    })),
    platformQuery("platform-pending-payments", () => prisma.payment.count({
      where: { verificationStatus: "PENDING" },
    })),
    platformQuery("platform-failed-payments", () => prisma.payment.count({
      where: { gatewayStatus: "FAILED" },
    })),

    platformQuery("platform-active-subscriptions", () => prisma.subscription.count({
      where: { status: "ACTIVE" },
    })),
    platformQuery("platform-trial-subscriptions", () => prisma.subscription.count({
      where: { status: "TRIALING" },
    })),
    platformQuery("platform-at-risk-subscriptions", () => prisma.subscription.count({
      where: {
        status: { in: ["EXPIRED", "CANCELLED", "PAST_DUE"] },
      },
    })),

    platformQuery("platform-recent-organizations", () => prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
        _count: {
          select: {
            properties: true,
            tenants: true,
            leases: true,
            payments: true,
            memberships: true,
          },
        },
      },
    })),

    platformQuery("platform-recent-payments", () => prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        org: { select: { name: true } },
        payerTenant: { select: { fullName: true } },
      },
    })),

    platformQuery("platform-new-onboarding-count", () =>
      prisma.onboardingRequest.count({ where: { status: "NEW" } }),
    ),

    platformQuery("platform-recent-onboarding", () =>
      prisma.onboardingRequest.findMany({
        where: { status: "NEW" },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: {
          marketer: { select: { fullName: true, referralCode: true } },
        },
      }),
    ),

    getOrganizationSeries(6),
    getRevenueSeries(6),
  ]);

  const currentRevenue = Number(currentRevenueAgg._sum.amount ?? 0);
  const previousRevenue = Number(previousRevenueAgg._sum.amount ?? 0);

  const organizationBars = buildBars(organizationSeries.map((item) => item.value));
  const revenueBars = buildBars(revenueSeries.map((item) => item.value));

  return (
    <div className="min-h-full text-slate-900 dark:text-slate-100">
      <OnboardingRequestPopup
        count={newOnboardingCount}
        latestRequestId={recentOnboardingRequests[0]?.id ?? null}
        latestCompany={recentOnboardingRequests[0]?.companyName ?? null}
      />
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
        {newOnboardingCount > 0 ? (
          <Link
            href="/platform/onboarding?status=NEW"
            className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-100 dark:border-amber-400/50 dark:bg-amber-950 dark:text-amber-50 dark:shadow-[0_0_0_1px_rgba(251,191,36,0.15)] dark:hover:border-amber-300/70 dark:hover:bg-amber-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-900 dark:bg-amber-400/20 dark:text-amber-100">
                <Bell className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-amber-950 dark:text-amber-50">
                  {formatNumber(newOnboardingCount)} new onboarding request
                  {newOnboardingCount === 1 ? "" : "s"} need attention
                </span>
                <span className="mt-1 block text-sm text-amber-900/80 dark:text-amber-100/90">
                  Latest: {recentOnboardingRequests[0]?.companyName ?? "New company"} from{" "}
                  {recentOnboardingRequests[0]?.fullName ?? "a new contact"}.
                </span>
              </span>
            </span>
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-amber-900 px-3 text-xs font-semibold text-white dark:bg-amber-400 dark:text-amber-950">
              Review queue
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </Link>
        ) : null}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 lg:p-5">
          <div className="grid gap-3 xl:grid-cols-[1.55fr_0.9fr]">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                label="Organizations"
                value={formatNumber(totalOrganizations)}
                meta={calcTrend(currentMonthOrgCount, previousMonthOrgCount)}
                metaTone={trendTone(currentMonthOrgCount, previousMonthOrgCount)}
              />
              <MetricCard
                label="Revenue"
                value={formatCompactCurrency(currentRevenue)}
                meta={calcTrend(currentRevenue, previousRevenue)}
                metaTone={trendTone(currentRevenue, previousRevenue)}
              />
              <MetricCard
                label="Online now"
                value={formatNumber(onlineUsers)}
                meta={`${formatNumber(totalUsers)} total users`}
                metaTone="text-emerald-600 dark:text-emerald-300"
              />
              <MetricCard
                label="Users"
                value={formatNumber(totalUsers)}
                meta={`${formatNumber(totalPlatformAdmins)} admins`}
                metaTone="text-slate-500 dark:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CompactInfoCard
                label="Payments"
                value={formatNumber(totalPayments)}
                helper={`${formatNumber(verifiedPayments)} verified`}
              />
              <CompactInfoCard
                label="Subscriptions"
                value={formatNumber(totalSubscriptions)}
                helper={`${formatNumber(activeSubscriptions)} active`}
              />
              <CompactInfoCard
                label="Portfolio"
                value={formatNumber(totalProperties)}
                helper={`${formatNumber(totalUnits)} units`}
              />
              <CompactInfoCard
                label="Onboarding"
                value={formatNumber(newOnboardingCount)}
                helper="new requests"
              />
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-5">
            <Panel title="Quick actions" subtitle="High-priority shortcuts">
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
                <ActionLink href="/platform/organizations/new" label="New organization" icon={Plus} />
                <ActionLink href="/platform/onboarding?status=NEW" label="New onboarding" icon={SlidersHorizontal} />
                <ActionLink href="/platform/users" label="Platform users" icon={Users} />
                <ActionLink href="/platform/billing" label="Billing center" icon={CreditCard} />
                <ActionLink href="/platform/audit-logs" label="Audit logs" icon={FileClock} />
              </div>
            </Panel>

            <Panel title="Platform health" subtitle="Core live totals">
              <div className="grid grid-cols-2 gap-2.5">
                <MiniStat label="Root admins" value={formatNumber(totalRootAdmins)} />
                <MiniStat label="Platform admins" value={formatNumber(totalPlatformAdmins)} />
                <MiniStat label="Properties" value={formatNumber(totalProperties)} />
                <MiniStat label="Units" value={formatNumber(totalUnits)} />
                <MiniStat label="Tenants" value={formatNumber(totalTenants)} />
                <MiniStat label="Leases" value={formatNumber(totalLeases)} />
              </div>
            </Panel>

            <Panel title="Subscription mix" subtitle="Current billing status">
              <div className="space-y-3.5">
                <ProgressRow
                  label="Active"
                  value={activeSubscriptions}
                  total={Math.max(totalSubscriptions, 1)}
                  tone="bg-stone-900"
                />
                <ProgressRow
                  label="Trialing"
                  value={trialSubscriptions}
                  total={Math.max(totalSubscriptions, 1)}
                  tone="bg-stone-500"
                />
                <ProgressRow
                  label="At risk"
                  value={atRiskSubscriptions}
                  total={Math.max(totalSubscriptions, 1)}
                  tone="bg-stone-300"
                />
              </div>
            </Panel>
          </aside>

          <main className="grid gap-5">
            <section className="grid gap-5 lg:grid-cols-[1.15fr_1.15fr_0.9fr]">
              <ChartPanel
                eyebrow="Growth"
                title="Organization growth"
                subtitle="New organizations over the last 6 months"
              >
                <PremiumBarChart
                  bars={organizationBars}
                  labels={organizationSeries.map((item) => item.label)}
                  values={organizationSeries.map((item) => item.value)}
                  valueFormatter={(value) => `${formatNumber(value)} orgs`}
                  tone="bg-stone-900"
                />
              </ChartPanel>

              <ChartPanel
                eyebrow="Revenue"
                title="Verified payment trend"
                subtitle="Collected revenue based on verified payments"
              >
                <PremiumBarChart
                  bars={revenueBars}
                  labels={revenueSeries.map((item) => item.label)}
                  values={revenueSeries.map((item) => item.value)}
                  valueFormatter={(value) => formatCompactCurrency(value)}
                  tone="bg-stone-400"
                />
              </ChartPanel>

              <Panel title="Executive summary" subtitle="Operational snapshot">
                <div className="grid grid-cols-2 gap-2.5">
                  <MiniStat label="Subscriptions" value={formatNumber(totalSubscriptions)} />
                  <MiniStat label="Audit logs" value={formatNumber(totalAuditLogs)} />
                  <MiniStat label="Verified" value={formatNumber(verifiedPayments)} />
                  <MiniStat label="Pending" value={formatNumber(pendingPayments)} />
                  <MiniStat label="Failed" value={formatNumber(failedPayments)} />
                  <MiniStat label="Revenue" value={formatCompactCurrency(currentRevenue)} />
                </div>
              </Panel>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.2fr_0.95fr]">
              <Panel title="Onboarding queue" subtitle="New requests needing first response">
                {recentOnboardingRequests.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
                    No new onboarding requests.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOnboardingRequests.map((request) => (
                      <Link
                        key={request.id}
                        href="/platform/onboarding?status=NEW"
                        className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                              {request.companyName}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                              {request.fullName} / {request.managedPropertyType}
                            </p>
                          </div>
                          <StatusBadge tone={statusTone("pending")}>NEW</StatusBadge>
                        </div>
                        <div className="mt-3 grid gap-2 text-[11px] text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{request.workEmail}</span>
                          </span>
                          {request.phone ? (
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{request.phone}</span>
                            </span>
                          ) : null}
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <Clock3 className="h-3.5 w-3.5 shrink-0" />
                            <span>{formatDate(request.createdAt)}</span>
                          </span>
                          <span className="truncate">
                            {request.marketer
                              ? `${request.marketer.fullName} (${request.marketer.referralCode})`
                              : request.referralCode
                                ? `Referral ${request.referralCode}`
                                : "No referral"}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="Recent organizations" subtitle="Newest workspaces on the platform">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {recentOrganizations.map((org) => (
                    <Link
                      key={org.id}
                      href={`/platform/organizations/${org.slug}`}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-950 text-sm font-semibold text-white dark:border-white/10 dark:bg-white dark:text-slate-950">
                            {getInitials(org.name)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-[15px] font-semibold text-slate-950 dark:text-white">
                              {org.name}
                            </h3>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                              {org.email ?? "No email provided"}
                            </p>
                          </div>
                        </div>
                        <StatusBadge tone={statusTone(org.status)}>{org.status}</StatusBadge>
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-2">
                        <OrgPill label="Props" value={org._count.properties} />
                        <OrgPill label="Tenants" value={org._count.tenants} />
                        <OrgPill label="Leases" value={org._count.leases} />
                        <OrgPill label="Staff" value={org._count.memberships} />
                      </div>

                      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                              Subscription
                            </p>
                            <p className="mt-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                              {org.subscription?.plan ?? "No active plan"}
                            </p>
                          </div>
                          {org.subscription?.status ? (
                            <StatusBadge tone={statusTone(org.subscription.status)}>
                              {org.subscription.status}
                            </StatusBadge>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{formatDate(org.createdAt)}</span>
                        <span className="truncate">{org.timezone ?? "—"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </Panel>

              <Panel title="Recent payments" subtitle="Latest platform transactions">
                <div className="space-y-3">
                  {recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                          {payment.payerTenant?.fullName ?? "Tenant payment"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {payment.org?.name ?? "Unknown organization"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">
                          {formatCurrency(Number(payment.amount ?? 0))}
                        </p>
                        <div className="mt-1 flex justify-end">
                          <StatusBadge tone={statusTone(payment.verificationStatus)}>
                            {payment.verificationStatus ?? "Unknown"}
                          </StatusBadge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 lg:p-5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950 dark:text-white">
          {subtitle}
        </h2>
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  meta,
  metaTone,
}: {
  label: string;
  value: string;
  meta: string;
  metaTone: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white lg:text-[22px]">
          {value}
        </p>
        <p className={`text-[11px] font-medium ${metaTone}`}>{meta}</p>
      </div>
    </div>
  );
}

function CompactInfoCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white lg:text-[22px]">
          {value}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helper}</p>
      </div>
    </div>
  );
}

function ActionLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3.5 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-white/25 dark:bg-slate-700 dark:shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] dark:hover:border-white/40 dark:hover:bg-slate-600"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 transition-colors group-hover:bg-white group-hover:text-slate-950 dark:bg-white/15 dark:text-white dark:ring-white/20 dark:group-hover:bg-white/25 dark:group-hover:text-white">
        <Icon className="h-4 w-4 stroke-[2.25]" />
      </div>
      <p className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-slate-950 dark:text-slate-50 dark:group-hover:text-white">
        {label}
      </p>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-slate-900">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}

function ChartPanel({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 lg:p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
      <div className="mt-4 h-[240px]">{children}</div>
    </section>
  );
}

function PremiumBarChart({
  bars,
  labels,
  values,
  valueFormatter,
  tone,
}: {
  bars: { id: number; value: number; height: number }[];
  labels: string[];
  values: number[];
  valueFormatter: (value: number) => string;
  tone: string;
}) {
  if (bars.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
        No analytics available.
      </div>
    );
  }

  return (
    <div className="flex h-full items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
      {bars.map((bar, index) => (
        <div key={bar.id} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end justify-center">
            <div
              className={`w-full max-w-[48px] rounded-t-lg ${tone} shadow-sm transition-all duration-200 group-hover:-translate-y-1 dark:bg-white`}
              style={{ height: `${bar.height}%` }}
              title={`${labels[index]}: ${valueFormatter(values[index])}`}
            />
          </div>
          <div className="w-full text-center">
            <p className="truncate text-[10px] font-semibold text-slate-700 dark:text-slate-200">
              {labels[index]}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              {valueFormatter(values[index])}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: string;
}) {
  const width = Math.max(6, Math.round((value / total) * 100));

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <span>{label}</span>
        <span>{formatNumber(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function OrgPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-center dark:border-white/10 dark:bg-slate-900">
      <p className="text-[9px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{formatNumber(value)}</p>
    </div>
  );
}

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {children}
    </span>
  );
}
