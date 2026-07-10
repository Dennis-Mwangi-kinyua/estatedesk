import { OnboardingRequestPopup } from "./onboarding-request-popup";
import type { PlatformDashboardData } from "../_lib/queries";
import { PlatformDashboardAlert } from "./platform-dashboard-alert";
import { PlatformDashboardAside } from "./platform-dashboard-aside";
import { PlatformDashboardMetrics } from "./platform-dashboard-metrics";
import { PlatformDashboardRecent } from "./platform-dashboard-recent";

export function PlatformDashboard({ data }: { data: PlatformDashboardData }) {
  const { newOnboardingCount, recentOnboardingRequests } = data;

  return (
    <div className="min-h-full text-slate-900 dark:text-slate-100">
      <OnboardingRequestPopup
        count={newOnboardingCount}
        latestRequestId={recentOnboardingRequests[0]?.id ?? null}
        latestCompany={recentOnboardingRequests[0]?.companyName ?? null}
      />
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-3 py-4 sm:px-4 lg:px-6 lg:py-6">
        <PlatformDashboardAlert
          newOnboardingCount={newOnboardingCount}
          recentOnboardingRequests={recentOnboardingRequests}
        />

        <PlatformDashboardMetrics data={data} />

        <div className="grid gap-5 xl:grid-cols-[290px_minmax(0,1fr)]">
          <PlatformDashboardAside data={data} />
          <PlatformDashboardRecent data={data} />
        </div>
      </div>
    </div>
  );
}