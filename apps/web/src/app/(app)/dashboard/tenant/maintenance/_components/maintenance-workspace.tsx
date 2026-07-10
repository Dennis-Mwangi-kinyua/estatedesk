import { PageShell } from "@/components/theme/ed-dashboard-shell";
import type { TenantMaintenancePageData } from "../_lib/types";
import { EmptyState } from "./empty-state";
import { IssuesHistorySection } from "./issues-history-section";
import { LatestIssueCard } from "./latest-issue-card";
import { MaintenanceHeader } from "./maintenance-header";
import { MaintenanceStats } from "./maintenance-stats";

export function MaintenanceWorkspace({
  data,
  currentPage,
}: {
  data: TenantMaintenancePageData;
  currentPage: number;
}) {
  if (!data.activeUnit || data.issues.length === 0) {
    return (
      <PageShell>
        <div className="space-y-4 sm:space-y-6">
          <MaintenanceHeader data={data} variant="empty" />
          <EmptyState hasUnit={!!data.activeUnit} />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <MaintenanceHeader data={data} />
        <MaintenanceStats data={data} />
        <LatestIssueCard data={data} />
        <IssuesHistorySection data={data} currentPage={currentPage} />
      </div>
    </PageShell>
  );
}