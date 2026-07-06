import type { OrgRole } from "@prisma/client";
import type { ChargesPageData } from "../_lib/types";
import { ChargesDirectorySection } from "./charges-directory-section";
import { ChargesGuidance } from "./charges-guidance";
import { ChargesHeader } from "./charges-header";
import { ChargesStats } from "./charges-stats";

export function ChargesWorkspace({
  data,
  orgRole,
}: {
  data: ChargesPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <ChargesHeader data={data} orgRole={orgRole} />
      <ChargesStats stats={data.stats} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ChargesDirectorySection charges={data.charges} />
        <ChargesGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}