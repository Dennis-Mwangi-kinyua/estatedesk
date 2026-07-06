import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  MiniMetric,
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerCalendarPageData } from "../_lib/types";
import { CalendarHeader } from "./calendar-header";
import { CalendarWeekGrid } from "./calendar-week-grid";

export function CalendarWorkspace({
  data,
}: {
  data: CaretakerCalendarPageData;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {!data.ok ? (
        <section className={panelShellClassName}>
          <div className={panelBodyClassName}>
            <ErrorStateCard
              title="Could not load calendar"
              message={data.errorMessage}
            />
          </div>
        </section>
      ) : (
        <>
          <CalendarHeader data={data} />
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            <MiniMetric
              label="Inspections"
              value={String(data.stats.inspections)}
            />
            <MiniMetric
              label="Meter pending"
              value={String(data.stats.meterPending)}
            />
            <MiniMetric label="Open issues" value={String(data.stats.issues)} />
            <MiniMetric label="Move-outs" value={String(data.stats.moveOuts)} />
            <MiniMetric
              label="Water bills"
              value={String(data.stats.waterBills)}
            />
          </section>
          <CalendarWeekGrid data={data} />
        </>
      )}

      <CaretakerWorkspaceFooter note="Weekly field operations calendar" />
    </div>
  );
}