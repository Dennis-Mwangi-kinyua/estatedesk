import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { ReadSidebar } from "@/app/(app)/dashboard/caretaker/water-bills/read/_components/read-sidebar";
import type { CaretakerReadingDetailPageData } from "../_lib/types";
import { ReadingDetailHeader } from "./reading-detail-header";
import { ReadingDetailStats } from "./reading-detail-stats";

export function ReadingDetailWorkspace({
  data,
}: {
  data: CaretakerReadingDetailPageData;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {!data.ok ? (
        <section className={panelShellClassName}>
          <div className={panelBodyClassName}>
            <ErrorStateCard
              title="Could not load meter reading"
              message={data.errorMessage}
            />
          </div>
        </section>
      ) : (
        <>
          <ReadingDetailHeader data={data} />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <ReadingDetailStats data={data} />
            <ReadSidebar />
          </div>
        </>
      )}

      <CaretakerWorkspaceFooter note="Submitted meter reading detail" />
    </div>
  );
}