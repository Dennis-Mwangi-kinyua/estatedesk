import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { ReadSidebar } from "../../_components/read-sidebar";
import { MeterReadingForm } from "../meter-reading-form";
import { MeterEntryHeader } from "./meter-entry-header";
import { SubmittedReadingPanel } from "./submitted-reading-panel";

type MeterEntryWorkspaceProps = {
  data: Awaited<ReturnType<typeof import("../_lib/queries").getCaretakerMeterEntryData>>;
};

export function MeterEntryWorkspace({ data }: MeterEntryWorkspaceProps) {
  const unit = data.ok ? data.unit : null;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {!data.ok || !unit ? (
        <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="p-5 sm:p-6">
            <ErrorStateCard
              title="Could not load meter entry"
              message={
                data.ok
                  ? "This unit could not be found."
                  : data.errorMessage
              }
            />
          </div>
        </section>
      ) : (
        <>
          <MeterEntryHeader
            period={data.period}
            houseNo={unit.houseNo}
            propertyName={unit.property.name}
            buildingName={unit.building?.name ?? null}
            tenantName={
              unit.leases[0]?.tenant.fullName ?? "No tenant assigned"
            }
          />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            {data.existingReading ? (
              <SubmittedReadingPanel
                prevReading={data.existingReading.prevReading}
                currentReading={data.existingReading.currentReading}
                unitsUsed={data.existingReading.unitsUsed}
                status={data.existingReading.status}
              />
            ) : (
              <section className={panelShellClassName}>
                <SectionIntro eyebrow="Capture" title="Enter meter readings" />
                <div className="p-5 sm:p-6">
                  <MeterReadingForm unitId={unit.id} period={data.period} />
                </div>
              </section>
            )}

            <ReadSidebar />
          </div>
        </>
      )}

      <CaretakerWorkspaceFooter note="Single-unit meter capture and submission" />
    </div>
  );
}