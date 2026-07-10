import type { OrgRole } from "@prisma/client";
import type { OrgLeasesPageData } from "../_lib/types";
import { LeasesDirectorySection } from "./leases-directory-section";
import { LeasesGuidance } from "./leases-guidance";
import { LeasesHeader } from "./leases-header";
import { LeasesStats } from "./leases-stats";

export function LeasesWorkspace({
  data,
  orgRole,
}: {
  data: OrgLeasesPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <LeasesHeader data={data} orgRole={orgRole} />
      <LeasesStats data={data} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <LeasesDirectorySection data={data} />
        <LeasesGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}