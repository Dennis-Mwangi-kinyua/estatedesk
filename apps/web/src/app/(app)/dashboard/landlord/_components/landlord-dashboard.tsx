import { PushNotificationSettingsPanel } from "@/components/pwa/push-notification-settings-panel";
import { OverviewSection } from "@/app/(app)/dashboard/landlord/_components/overview-section";
import { PortfolioActionsSection } from "@/app/(app)/dashboard/landlord/_components/portfolio-actions-section";
import { PropertiesSection } from "@/app/(app)/dashboard/landlord/_components/properties-section";
import { ReportsTenantsSection } from "@/app/(app)/dashboard/landlord/_components/reports-tenants-section";
import { SummaryStatsSection } from "@/app/(app)/dashboard/landlord/_components/summary-stats-section";
import type { LandlordDashboardData } from "@/app/(app)/dashboard/landlord/_lib/types";

export function LandlordDashboard({ data }: { data: LandlordDashboardData }) {
  return (
    <div className="space-y-5">
      <PushNotificationSettingsPanel />
      <OverviewSection data={data} />
      <SummaryStatsSection data={data} />
      <PortfolioActionsSection data={data} />
      <ReportsTenantsSection data={data} />
      <PropertiesSection data={data} />
    </div>
  );
}