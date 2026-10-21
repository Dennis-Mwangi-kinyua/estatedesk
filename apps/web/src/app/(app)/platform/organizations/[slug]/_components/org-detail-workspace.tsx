import type { getOrganizationDetailData } from "../_lib/queries";
import { OrgDetailActivitySection } from "./org-detail-activity-section";
import { OrgDetailOverviewSection } from "./org-detail-overview-section";
import Link from "@/components/navigation/workspace-link";

export type OrgDetailWorkspaceProps = Awaited<ReturnType<typeof getOrganizationDetailData>>;

export function OrgDetailWorkspace(props: OrgDetailWorkspaceProps) {
  return (
    <div className="organisation-detail-page mx-auto w-full max-w-7xl space-y-4 sm:space-y-5">
      <OrgDetailOverviewSection {...props} />
      <Link href={`/platform/organizations/${props.org.slug}/access`} className="inline-flex min-h-11 items-center rounded-xl border bg-card px-4 py-3 text-sm font-semibold">Manage organization role access</Link>
      <Link href={`/platform/organizations/${props.org.slug}/tenants`} className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">View tenants and individual records</Link>
      <OrgDetailActivitySection {...props} />
    </div>
  );
}
