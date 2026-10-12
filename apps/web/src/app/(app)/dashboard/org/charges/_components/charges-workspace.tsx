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
    <div className="org-theme-content uniform-page-actions mx-auto w-full min-w-0 max-w-7xl space-y-5 px-0 pb-24 pt-2 sm:px-2">
      <ChargesHeader data={data} orgRole={orgRole} />
      <ChargesStats stats={data.stats} />

      <ChargesDirectorySection charges={data.charges} />
      <ChargesGuidance orgRole={orgRole} />
    </div>
  );
}