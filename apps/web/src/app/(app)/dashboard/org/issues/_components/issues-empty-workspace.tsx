import type { OrgRole } from "@prisma/client";
import { IssuesEmptyGuidance } from "./issues-empty-guidance";
import { IssuesEmptyHeader } from "./issues-empty-header";
import { IssuesEmptyState } from "./issues-empty-state";

type IssuesEmptyWorkspaceProps = {
  organizationName: string;
  role: OrgRole;
  orgRole?: OrgRole | null;
};

export function IssuesEmptyWorkspace({
  organizationName,
  role,
  orgRole,
}: IssuesEmptyWorkspaceProps) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <IssuesEmptyHeader
        organizationName={organizationName}
        role={role}
        orgRole={orgRole}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <IssuesEmptyState organizationName={organizationName} role={role} />
        <IssuesEmptyGuidance orgRole={orgRole ?? role} />
      </div>
    </div>
  );
}