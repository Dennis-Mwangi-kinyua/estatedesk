import type { CaretakerLeasesPageData } from "../_lib/types";
import { LeasesHeader } from "./leases-header";
import { LeasesList } from "./leases-list";
import { LeasesStats } from "./leases-stats";

export function LeasesWorkspace({ data }: { data: CaretakerLeasesPageData }) {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6"
      data-workspace="caretaker"
    >
      <LeasesHeader data={data} />
      <LeasesStats data={data} />

      <LeasesList data={data} />

    </div>
  );
}
