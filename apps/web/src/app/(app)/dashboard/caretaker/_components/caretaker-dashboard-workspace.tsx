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
          {result.data.assignedUnits === 0 ? <section className={`${panelShellClassName} p-5 sm:p-6`}><h2 className="text-base font-semibold text-foreground">Your current assignment</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">No apartments are currently allocated to you. Any issues or inspections assigned directly to you remain available. Contact the office if an apartment allocation is missing.</p></section> : null}

          <div className="grid min-w-0 items-stretch gap-5 xl:grid-cols-2">
            <CaretakerDashboardFocusSection data={result.data} />
            <CaretakerDashboardActivitySection recentIssues={result.data.recentIssues} />
          </div>
          <CaretakerDashboardSidebar data={result.data} upcomingInspections={result.data.upcomingInspections} />
        </>
      )}

      <CaretakerWorkspaceFooter note="Field operations overview" />
    </div>
  );
}