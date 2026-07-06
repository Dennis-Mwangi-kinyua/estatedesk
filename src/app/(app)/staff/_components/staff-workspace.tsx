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
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <StaffHeader data={data} orgRole={orgRole} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <StaffDirectorySection data={data} />
        <StaffGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}