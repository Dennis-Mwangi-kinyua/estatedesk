import { PlatformActionAlerts } from "./platform-action-alerts";
import { PlatformDashboardHeading } from "./platform-dashboard-heading";

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
        <section className="platform-dashboard-intro pb-1">
          <PlatformDashboardHeading />
        </section>
        <PlatformDashboardMetrics data={data} />
        <PlatformDashboardAlert
          newOnboardingCount={newOnboardingCount}
          recentOnboardingRequests={recentOnboardingRequests}
        />
        <PendingDataExportAlert count={data.pendingDataExportCount} requests={data.recentDataExportRequests} />
        <PlatformActionAlerts counts={data.actionCounts ?? {overdue:0,upgrades:0,countersignatures:0}} />
        <PlatformActionAlerts counts={data.actionCounts ?? {overdue:0,upgrades:0,countersignatures:0}} />

        <PlatformDashboardAside data={data} />
        <PlatformDashboardRecent data={data} />
      </div>
    </div>
  );
}
