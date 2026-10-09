import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerInspectionsPageData } from "../_lib/queries";
import { InspectionsHeader } from "./inspections-header";
import { InspectionsList } from "./inspections-list";
import { InspectionsStats } from "./inspections-stats";

export type InspectionsWorkspaceProps = {
  data: CaretakerInspectionsPageData;
};

export function InspectionsWorkspace({ data }: InspectionsWorkspaceProps) {
  return (
    <div className="mx-auto w-full max-w-none space-y-5 pb-6 sm:space-y-6" data-workspace="caretaker">
      {data.ok ? <InspectionsHeader stats={data.stats} /> : null}

      {!data.ok ? (
        <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="p-5 sm:p-6">
            <ErrorStateCard
              title="Could not load inspections"
              message={data.errorMessage}
            />
          </div>
        </section>
      ) : (
        <>
          <InspectionsStats stats={data.stats} />

          <InspectionsList inspections={data.inspections} />
        </>
      )}

      <CaretakerWorkspaceFooter note="Inspection tasks assigned to you and within your caretaker scope" />
    </div>
  );
}
