import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import {
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerInspectionsPageData } from "../_lib/queries";
import { InspectionCard } from "./inspection-card";

type InspectionsListProps = {
  inspections: CaretakerInspectionsPageData["inspections"];
};

export function InspectionsList({ inspections }: InspectionsListProps) {
  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Inspection board"
        title="Allocated inspection tasks"
        action={
          <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
            {inspections.length} total
          </span>
        }
      />

      <p className="border-b border-border px-5 pb-4 text-sm leading-6 text-muted-foreground sm:px-6">
        Open an inspection task, perform the visit, and submit a report.
      </p>

      <div className="p-4 sm:p-5">
        {inspections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No inspections found for your current allocations.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
              <InAppGuideLink topic="moveOut" workspace="caretaker" />
              <InAppGuideLink topic="caretaker" workspace="caretaker" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {inspections.map((inspection) => (
              <InspectionCard key={inspection.id} inspection={inspection} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}