import {
  calcTrend,
  formatCompactCurrency,
  formatNumber,
  trendTone,
} from "../_lib/helpers";
import type { PlatformDashboardData } from "../_lib/queries";
import { CompactInfoCard, MetricCard } from "./platform-ui";

export function PlatformDashboardMetrics({
  data,
}: {
  data: PlatformDashboardData;
}) {
  const {
    totalUsers,
    onlineUsers,
    totalPlatformAdmins,
    totalOrganizations,
    totalProperties,
    totalUnits,
    totalSubscriptions,
    totalPayments,
    currentMonthOrgCount,
    previousMonthOrgCount,
    currentRevenue,
    previousRevenue,
    verifiedPayments,
    activeSubscriptions,
    newOnboardingCount,
  } = data;

  return (
    <section className="platform-glass-metrics overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 lg:p-5">
      <div className="grid gap-3 xl:grid-cols-[1.55fr_0.9fr]">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Organizations"
            emoji="🏢"
            href="/platform/organizations"
            value={formatNumber(totalOrganizations)}
            meta={calcTrend(currentMonthOrgCount, previousMonthOrgCount)}
            metaTone={trendTone(currentMonthOrgCount, previousMonthOrgCount)}
          />
          <MetricCard
            label="Revenue"
            emoji="💰"
            href="/platform/reports"
            value={formatCompactCurrency(currentRevenue)}
            meta={calcTrend(currentRevenue, previousRevenue)}
            metaTone={trendTone(currentRevenue, previousRevenue)}
          />
          <MetricCard
            label="Online now"
            emoji="🟢"
            href="/platform/users"
            value={formatNumber(onlineUsers)}
            meta={`${formatNumber(totalUsers)} total users`}
            metaTone="text-emerald-600 dark:text-emerald-300"
          />
          <MetricCard
            label="Users"
            emoji="👥"
            href="/platform/users"
            value={formatNumber(totalUsers)}
            meta={`${formatNumber(totalPlatformAdmins)} admins`}
            metaTone="text-slate-500 dark:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CompactInfoCard
            label="Payments"
            emoji="💸"
            href="/platform/payments"
            value={formatNumber(totalPayments)}
            helper={`${formatNumber(verifiedPayments)} verified`}
          />
          <CompactInfoCard
            label="Subscriptions"
            emoji="🎟️"
            href="/platform/subscriptions"
            value={formatNumber(totalSubscriptions)}
            helper={`${formatNumber(activeSubscriptions)} active`}
          />
          <CompactInfoCard
            label="Portfolio"
            emoji="🏘️"
            href="/platform/organizations"
            value={formatNumber(totalProperties)}
            helper={`${formatNumber(totalUnits)} units`}
          />
          <CompactInfoCard
            label="Onboarding"
            emoji="👋"
            href="/platform/onboarding"
            value={formatNumber(newOnboardingCount)}
            helper="new requests"
          />
        </div>
      </div>
    </section>
  );
}