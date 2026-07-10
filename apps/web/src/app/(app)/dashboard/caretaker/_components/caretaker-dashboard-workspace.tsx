import type { CaretakerDashboardResult } from "@/app/(app)/dashboard/caretaker/_lib/types";
import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  panelBodyClassName,
  panelShellClassName,
} from "./caretaker-ui";
import { CaretakerDashboardActivitySection } from "./caretaker-dashboard-activity-section";
import { CaretakerDashboardFocusSection } from "./caretaker-dashboard-focus-section";
import { CaretakerDashboardHeader } from "./caretaker-dashboard-header";
import { CaretakerDashboardSidebar } from "./caretaker-dashboard-sidebar";

export type CaretakerDashboardWorkspaceProps = {
  result: CaretakerDashboardResult;
  fullName: string;
};

export function CaretakerDashboardWorkspace({
  result,
  fullName,
}: CaretakerDashboardWorkspaceProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {!result.ok ? (
        <section className={panelShellClassName}>
          <div className={panelBodyClassName}>
            <ErrorStateCard
              title="Could not load dashboard"
              message={result.errorMessage}
            />
          </div>
        </section>
      ) : (
        <>
          <CaretakerDashboardHeader data={result.data} fullName={fullName} />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <CaretakerDashboardActivitySection
                recentIssues={result.data.recentIssues}
              />
              <CaretakerDashboardFocusSection data={result.data} />
            </div>

            <CaretakerDashboardSidebar
              data={result.data}
              upcomingInspections={result.data.upcomingInspections}
            />
          </div>
        </>
      )}

      <CaretakerWorkspaceFooter note="Field operations overview" />
    </div>
  );
}