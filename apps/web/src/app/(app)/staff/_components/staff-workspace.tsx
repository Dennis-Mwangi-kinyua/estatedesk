import type { OrgRole } from "@prisma/client";
import type { getStaffDirectoryData } from "../_lib/queries";
import { StaffDirectorySection } from "./staff-directory-section";
import { StaffGuidance } from "./staff-guidance";
import { StaffHeader } from "./staff-header";

export type StaffWorkspaceProps = {
  data: Awaited<ReturnType<typeof getStaffDirectoryData>>;
  orgRole?: OrgRole | null;
};

export function StaffWorkspace({ data, orgRole }: StaffWorkspaceProps) {
  return (
    <div className="org-theme-content mx-auto w-full min-w-0 max-w-7xl space-y-4 px-0 pb-8 pt-1 sm:space-y-6 sm:px-2 lg:px-4">
      <StaffHeader data={data} orgRole={orgRole} />

      <div className="grid min-w-0 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <StaffDirectorySection data={data} />
        <StaffGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}