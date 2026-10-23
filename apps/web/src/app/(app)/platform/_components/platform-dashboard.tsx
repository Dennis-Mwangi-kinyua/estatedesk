import { PlatformActionAlerts } from "./platform-action-alerts";
import { PlatformDashboardHeading } from "./platform-dashboard-heading";

import { PlatformAppLauncher } from "./platform-app-launcher";
import type { PlatformDashboardData } from "../_lib/queries";
import { PlatformDashboardAlert } from "./platform-dashboard-alert";
import { PlatformDashboardAside } from "./platform-dashboard-aside";
import { PlatformDashboardMetrics } from "./platform-dashboard-metrics";
import { PlatformDashboardRecent } from "./platform-dashboard-recent";
import { PendingDataExportAlert } from "./pending-data-export-alert";

export function PlatformDashboard({ data }: { data: PlatformDashboardData }) {
  const { newOnboardingCount, recentOnboardingRequests } = data;

  return (
    <div className="platform-glass-dashboard min-h-full text-slate-900 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
        <section className="platform-glass-hero relative overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-5 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950/40 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <PlatformDashboardHeading />
          </div>
          <PlatformAppLauncher />
        </section>
        <PlatformDashboardAlert
          newOnboardingCount={newOnboardingCount}
          recentOnboardingRequests={recentOnboardingRequests}
        />
        <PendingDataExportAlert count={data.pendingDataExportCount} requests={data.recentDataExportRequests} />

        <PlatformActionAlerts counts={data.actionCounts ?? {overdue:0,upgrades:0,countersignatures:0}} />
        <PlatformDashboardMetrics data={data} />

        <PlatformDashboardAside data={data} />
        <PlatformDashboardRecent data={data} />
      </div>
    </div>
  );
}
