import type { RoleMembersDirectoryData } from "../_lib/queries";
import { RoleMembersDirectorySection } from "./role-members-directory-section";
import { RoleMembersGuidance } from "./role-members-guidance";
import { RoleMembersHeader } from "./role-members-header";

type RoleMembersWorkspaceProps = {
  data: RoleMembersDirectoryData;
};

export function RoleMembersWorkspace({ data }: RoleMembersWorkspaceProps) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <RoleMembersHeader data={data} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <RoleMembersDirectorySection data={data} />
        <RoleMembersGuidance role={data.role} />
      </div>
    </div>
  );
}