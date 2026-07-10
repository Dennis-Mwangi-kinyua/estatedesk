import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerTodayWorkPageData } from "../_lib/types";
import { TodayHeader } from "./today-header";
import { TodaySidebar } from "./today-sidebar";
import { TodayStats } from "./today-stats";
import { TodayTaskList } from "./today-task-list";

export function TodayWorkspace({ data }: { data: CaretakerTodayWorkPageData }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {!data.ok ? (
        <section className={panelShellClassName}>
          <div className={panelBodyClassName}>
            <ErrorStateCard
              title="Could not load today's work"
              message={data.errorMessage}
            />
          </div>
        </section>
      ) : (
        <>
          <TodayHeader data={data} />
          <TodayStats data={data} />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <TodayTaskList tasks={data.tasks} />
            <TodaySidebar />
          </div>
        </>
      )}

      <CaretakerWorkspaceFooter note="Daily field operations command center" />
    </div>
  );
}