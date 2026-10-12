import Link from "@/components/navigation/workspace-link";
import { PlatformSticker } from "./platform-sticker";
import { ArrowUpRight } from "lucide-react";
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  statusTone,
} from "../_lib/helpers";
import type { PlatformDashboardData } from "../_lib/queries";
import {
  OrganizationWorkspaceCard,
  OrganizationWorkspaceCardEmpty,
} from "./organization-workspace-card";
import {
  ChartPanel,
  MiniStat,
  Panel,
  PremiumBarChart,
  StatusBadge,
} from "./platform-ui";

export function PlatformDashboardRecent({
  data,
}: {
  data: PlatformDashboardData;
}) {
  const {
    recentOrganizations,
    recentPayments,
    totalSubscriptions,
    totalAuditLogs,
    verifiedPayments,
    pendingPayments,
    failedPayments,
    currentRevenue,
    organizationSeries,
    revenueSeries,
    organizationBars,
    revenueBars,
  } = data;

  return (
    <div className="grid min-w-0 gap-5">
      <section className="platform-analytics-grid grid min-w-0 items-stretch gap-5 md:grid-cols-2 min-[1600px]:grid-cols-[1fr_1fr_0.9fr]">
        <ChartSection
          organizationSeries={organizationSeries}
          revenueSeries={revenueSeries}
          organizationBars={organizationBars}
          revenueBars={revenueBars}
          totalSubscriptions={totalSubscriptions}
          totalAuditLogs={totalAuditLogs}
          verifiedPayments={verifiedPayments}
          pendingPayments={pendingPayments}
          failedPayments={failedPayments}
          currentRevenue={currentRevenue}
        />
      </section>

      <section className="platform-activity-grid grid min-w-0 items-start gap-5">
        <Panel title="Recent organizations" subtitle="The 10 newest workspaces · select an organization to open it">
          <div className="mb-4 flex justify-end"><Link href="/platform/organizations" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary">View all organizations<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link></div>
          <div className="platform-recent-organizations grid gap-3 sm:grid-cols-2">
            {recentOrganizations.length === 0 ? (
              <OrganizationWorkspaceCardEmpty />
            ) : (
              recentOrganizations.map((org) => (
                <OrganizationWorkspaceCard
                  layout="directory"
                  key={org.id}
                  href={`/platform/organizations/${org.slug}`}
                  name={org.name}
                  slug={org.slug}
                  email={org.email}
                  phone={org.phone}
                  status={org.status}
                  timezone={org.timezone}
                  createdAt={org.createdAt}
                  metrics={{
                    properties: org._count.properties,
                    tenants: org._count.tenants,
                    leases: org._count.leases,
                    staff: org._count.memberships,
                  }}
                  subscription={org.subscription}
                />
              ))
            )}
          </div>
        </Panel>

        <Panel title="Recent payments" subtitle="Latest platform transactions">
          <div className="grid gap-3 sm:grid-cols-2">
            {recentPayments.length === 0 && (
              <p className="col-span-full rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">No recent payments.</p>
            )}
            {recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="platform-glass-inset group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:bg-slate-950 dark:hover:border-white/20"
              >
                <PlatformSticker label="Payment" className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="ed-full-name whitespace-normal break-words [overflow-wrap:anywhere] text-sm font-semibold text-slate-950 dark:text-white">
                    {payment.payerTenant?.fullName ?? "Tenant payment"}
                  </p>
                  <p className="mt-0.5 ed-full-name whitespace-normal break-words [overflow-wrap:anywhere] text-xs text-slate-500 dark:text-slate-400">
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
    </div>
  );
}

function ChartSection({
  organizationSeries,
  revenueSeries,
  organizationBars,
  revenueBars,
  totalSubscriptions,
  totalAuditLogs,
  verifiedPayments,
  pendingPayments,
  failedPayments,
  currentRevenue,
}: {
  organizationSeries: PlatformDashboardData["organizationSeries"];
  revenueSeries: PlatformDashboardData["revenueSeries"];
  organizationBars: PlatformDashboardData["organizationBars"];
  revenueBars: PlatformDashboardData["revenueBars"];
  totalSubscriptions: number;
  totalAuditLogs: number;
  verifiedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  currentRevenue: number;
}) {
  return (
    <>
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
    </>
  );
}
