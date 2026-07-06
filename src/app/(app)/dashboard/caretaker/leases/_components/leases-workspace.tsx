import { CaretakerWorkspaceFooter } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerLeasesPageData } from "../_lib/types";
import { LeasesHeader } from "./leases-header";
import { LeasesList } from "./leases-list";
import { LeasesSidebar } from "./leases-sidebar";
import { LeasesStats } from "./leases-stats";

export function LeasesWorkspace({ data }: { data: CaretakerLeasesPageData }) {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6"
      data-workspace="caretaker"
    >
      <LeasesHeader data={data} />
      <LeasesStats data={data} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <LeasesList data={data} />
        <LeasesSidebar />
      </div>

      <CaretakerWorkspaceFooter note="Allocation-based lease records for caretakers" />
    </div>
  );
}