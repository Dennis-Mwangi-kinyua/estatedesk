import type { getOrganizationDetailData } from "../_lib/queries";
import { OrgDetailActivitySection } from "./org-detail-activity-section";
import { OrgDetailOverviewSection } from "./org-detail-overview-section";

export type OrgDetailWorkspaceProps = Awaited<ReturnType<typeof getOrganizationDetailData>>;

export function OrgDetailWorkspace(props: OrgDetailWorkspaceProps) {
  return (
    <div className="space-y-6">
      <OrgDetailOverviewSection {...props} />
      <OrgDetailActivitySection {...props} />
    </div>
  );
}