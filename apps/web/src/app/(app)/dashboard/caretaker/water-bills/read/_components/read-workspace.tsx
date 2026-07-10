import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerMeterReadPageData } from "../_lib/types";
import { ReadHeader } from "./read-header";
import { ReadPendingList } from "./read-pending-list";
import { ReadSidebar } from "./read-sidebar";
import { ReadStats } from "./read-stats";

export function ReadWorkspace({ data }: { data: CaretakerMeterReadPageData }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {data.ok ? <ReadHeader data={data} /> : null}

      {!data.ok ? (
        <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="p-5 sm:p-6">
            <ErrorStateCard
              title="Could not load meter readings"
              message={data.errorMessage}
            />
          </div>
        </section>
      ) : (
        <>
          <ReadStats data={data} />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ReadPendingList data={data} />
            <ReadSidebar />
          </div>
        </>
      )}

      <CaretakerWorkspaceFooter note="Meter readings per assigned unit · building or single-unit scope" />
    </div>
  );
}