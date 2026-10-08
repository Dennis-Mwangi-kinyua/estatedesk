import type { getOrganizationDetailData } from "../_lib/queries";
import { OrgDetailActivitySection } from "./org-detail-activity-section";
import { OrgDetailOverviewSection } from "./org-detail-overview-section";

export type OrgDetailWorkspaceProps = Awaited<ReturnType<typeof getOrganizationDetailData>>;

export function OrgDetailWorkspace(props: OrgDetailWorkspaceProps) {
  return (
    <div className="organisation-detail-page mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      <OrgDetailOverviewSection {...props} />
      <OrgDetailActivitySection {...props} />
    </div>
  );
}