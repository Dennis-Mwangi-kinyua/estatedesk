import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";

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
  if (current > previous) return "text-emerald-600";
  if (current < previous) return "text-rose-600";
  return "text-stone-500";
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
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
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
    return "border-amber-200 bg-amber-50 text-amber-700";
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
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-stone-200 bg-stone-100 text-stone-700";
}

function buildBars(values: number[]) {
  const max = Math.max(...values, 1);
  return values.map((value, index) => ({
    id: index,
    value,
    height: Math.max(14, Math.round((value / max) * 100)),
  }));
}

async function getOrganizationSeries(months = 6): Promise<TrendPoint[]> {
  const now = new Date();
  const monthStarts = Array.from({ length: months }, (_, i) =>
    startOfMonth(addMonths(now, -(months - 1) + i)),
  );

  const results = await Promise.all(
    monthStarts.map(async (monthStart) => {
      const nextMonth = addMonths(monthStart, 1);

      const value = await prisma.organization.count({
        where: {
          deletedAt: null,
          createdAt: {
            gte: monthStart,
            lt: nextMonth,
          },
        },
      });

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

      const agg = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          paidAt: {
            gte: monthStart,
            lt: nextMonth,
          },
          verificationStatus: "VERIFIED",
        },
      });

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
    organizationSeries,
    revenueSeries,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: {
        deletedAt: null,
        isRootSuperAdmin: true,
      },
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        OR: [{ platformRole: "SUPER_ADMIN" }, { platformRole: "PLATFORM_ADMIN" }],
      },
    }),
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.property.count({ where: { deletedAt: null } }),
    prisma.unit.count({ where: { deletedAt: null } }),
    prisma.tenant.count({ where: { deletedAt: null } }),
    prisma.lease.count({ where: { deletedAt: null } }),
    prisma.subscription.count(),
    prisma.payment.count(),
    prisma.auditLog.count(),

    prisma.organization.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
      },
    }),
    prisma.organization.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: previousMonthStart,
          lt: currentMonthStart,
        },
      },
    }),

    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paidAt: {
          gte: currentMonthStart,
          lt: nextMonthStart,
        },
        verificationStatus: "VERIFIED",
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paidAt: {
          gte: previousMonthStart,
          lt: currentMonthStart,
        },
        verificationStatus: "VERIFIED",
      },
    }),

    prisma.payment.count({
      where: { verificationStatus: "VERIFIED" },
    }),
    prisma.payment.count({
      where: { verificationStatus: "PENDING" },
    }),
    prisma.payment.count({
      where: { gatewayStatus: "FAILED" },
    }),

    prisma.subscription.count({
      where: { status: "ACTIVE" },
    }),
    prisma.subscription.count({
      where: { status: "TRIALING" },
    }),
    prisma.subscription.count({
      where: {
        status: { in: ["EXPIRED", "CANCELLED", "PAST_DUE"] },
      },
    }),

    prisma.organization.findMany({
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
    }),

    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        org: { select: { name: true } },
        payerTenant: { select: { fullName: true } },
      },
    }),

    getOrganizationSeries(6),
    getRevenueSeries(6),
  ]);

  const currentRevenue = Number(currentRevenueAgg._sum.amount ?? 0);
  const previousRevenue = Number(previousRevenueAgg._sum.amount ?? 0);

  const organizationBars = buildBars(organizationSeries.map((item) => item.value));
  const revenueBars = buildBars(revenueSeries.map((item) => item.value));

  return (
    <div className="min-h-screen bg-[#f6f4ef] text-stone-900">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
        <section className="overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,247,242,0.96)_100%)] p-4 shadow-[0_18px_50px_rgba(28,25,23,0.06)] lg:p-5">
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
                label="Users"
                value={formatNumber(totalUsers)}
                meta={`${formatNumber(totalPlatformAdmins)} admins`}
                metaTone="text-stone-500"
              />
              <MetricCard
                label="Payments"
                value={formatNumber(totalPayments)}
                meta={`${formatNumber(verifiedPayments)} verified`}
                metaTone="text-stone-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-5">
            <Panel title="Quick actions" subtitle="High-priority shortcuts">
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
                <ActionLink href="/platform/organizations/new" label="New organization" icon="＋" />
                <ActionLink href="/platform/users" label="Platform users" icon="👤" />
                <ActionLink href="/platform/billing" label="Billing center" icon="💳" />
                <ActionLink href="/platform/audit-logs" label="Audit logs" icon="🕘" />
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
              <Panel title="Recent organizations" subtitle="Newest workspaces on the platform">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  {recentOrganizations.map((org) => (
                    <Link
                      key={org.id}
                      href={`/platform/organizations/${org.id}`}
                      className="group relative flex flex-col overflow-hidden rounded-[28px] border border-stone-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8f7f4_100%)] p-4 shadow-[0_8px_22px_rgba(28,25,23,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_32px_rgba(28,25,23,0.08)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/80"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-stone-950 text-sm font-semibold text-white">
                            {getInitials(org.name)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-[15px] font-semibold text-stone-950">
                              {org.name}
                            </h3>
                            <p className="mt-0.5 truncate text-[11px] text-stone-500">
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

                      <div className="mt-4 rounded-[20px] border border-stone-200/80 bg-white/80 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                              Subscription
                            </p>
                            <p className="mt-1 truncate text-xs font-medium text-stone-700">
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

                      <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[11px] text-stone-500">
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
                      className="group flex items-center justify-between gap-3 rounded-[24px] border border-stone-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8f7f4_100%)] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_22px_rgba(28,25,23,0.06)]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-stone-900">
                          {payment.payerTenant?.fullName ?? "Tenant payment"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-stone-500">
                          {payment.org?.name ?? "Unknown organization"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-stone-950">
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
    <section className="rounded-[34px] border border-white/80 bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf7_100%)] p-4 shadow-[0_14px_34px_rgba(28,25,23,0.05)] lg:p-5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          {title}
        </p>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-stone-950">
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
    <div className="group relative overflow-hidden rounded-[26px] border border-stone-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8f7f4_100%)] px-4 py-3.5 shadow-[0_8px_20px_rgba(28,25,23,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(28,25,23,0.07)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/80">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-lg font-semibold tracking-tight text-stone-950 lg:text-[22px]">
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
    <div className="group relative overflow-hidden rounded-[26px] border border-stone-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8f7f4_100%)] px-4 py-3.5 shadow-[0_8px_20px_rgba(28,25,23,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(28,25,23,0.07)] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/80">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-lg font-semibold tracking-tight text-stone-950 lg:text-[22px]">
          {value}
        </p>
        <p className="text-[11px] text-stone-500">{helper}</p>
      </div>
    </div>
  );
}

function ActionLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-[24px] border border-stone-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8f7f4_100%)] px-3.5 py-3.5 shadow-[0_6px_16px_rgba(28,25,23,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_24px_rgba(28,25,23,0.07)]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-stone-100 text-sm text-stone-800 transition-all duration-300 group-hover:scale-105 group-hover:bg-stone-900 group-hover:text-white">
        {icon}
      </div>
      <p className="truncate text-sm font-semibold text-stone-800 transition-colors duration-300 group-hover:text-stone-950">
        {label}
      </p>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-stone-200/80 bg-stone-50/80 px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-stone-950">{value}</p>
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
    <section className="rounded-[34px] border border-white/80 bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf7_100%)] p-4 shadow-[0_14px_34px_rgba(28,25,23,0.05)] lg:p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-stone-950">
          {title}
        </h2>
        <p className="mt-1 text-xs text-stone-500">{subtitle}</p>
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
      <div className="flex h-full items-center justify-center rounded-[24px] border border-stone-200 bg-stone-50 text-sm text-stone-500">
        No analytics available.
      </div>
    );
  }

  return (
    <div className="flex h-full items-end gap-2 rounded-[24px] border border-stone-200/80 bg-[linear-gradient(180deg,#fafaf9_0%,#f5f4f1_100%)] p-3">
      {bars.map((bar, index) => (
        <div key={bar.id} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end justify-center">
            <div
              className={`w-full max-w-[48px] rounded-t-[16px] ${tone} shadow-[0_10px_20px_rgba(28,25,23,0.08)] transition-all duration-300 group-hover:-translate-y-1`}
              style={{ height: `${bar.height}%` }}
              title={`${labels[index]}: ${valueFormatter(values[index])}`}
            />
          </div>
          <div className="w-full text-center">
            <p className="truncate text-[10px] font-semibold text-stone-700">
              {labels[index]}
            </p>
            <p className="mt-0.5 text-[10px] text-stone-500">
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
      <div className="mb-1.5 flex items-center justify-between text-xs text-stone-600">
        <span>{label}</span>
        <span>{formatNumber(value)}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-stone-200">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function OrgPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[16px] border border-stone-200/80 bg-white/80 p-2 text-center">
      <p className="text-[9px] uppercase tracking-[0.14em] text-stone-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-stone-950">{formatNumber(value)}</p>
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