import type { OrgRole } from "@prisma/client";
import type { OrgExpendituresPageData } from "../_lib/types";
import { ExpendituresDirectorySection } from "./expenditures-directory-section";
import { ExpendituresForm } from "./expenditures-form";
import { ExpendituresGuidance } from "./expenditures-guidance";
import { ExpendituresHeader } from "./expenditures-header";
import { ExpendituresStats } from "./expenditures-stats";

export function ExpendituresWorkspace({
  data,
  orgRole,
  defaultDate,
}: {
  data: OrgExpendituresPageData;
  orgRole?: OrgRole | null;
  defaultDate: string;
}) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <ExpendituresHeader data={data} orgRole={orgRole} />
      <ExpendituresStats data={data} />
      <ExpendituresForm
        data={data}
        defaultDate={defaultDate}
        orgRole={orgRole}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ExpendituresDirectorySection data={data} orgRole={orgRole} />
        <ExpendituresGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}