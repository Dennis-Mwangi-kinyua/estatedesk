import Link from "next/link";
import { Clock3, Mail, Phone } from "lucide-react";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
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
    recentOnboardingRequests,
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
    <main className="grid gap-5">
      <section className="grid gap-5 lg:grid-cols-[1.15fr_1.15fr_0.9fr]">
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
          <div className="space-y-3">
            {recentOrganizations.length === 0 ? (
              <OrganizationWorkspaceCardEmpty />
            ) : (
              recentOrganizations.map((org) => (
                <OrganizationWorkspaceCard
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