import { redirect } from "next/navigation";
import { requireOrgRole } from "@/lib/permissions/guards";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";
import { getOrganizationSummary } from "@/lib/organizations/summary";
import { LandlordDirectory } from "@/features/landlords/directory";
import { createOrgLandlord, mapOrgLandlord, manageOrgLandlord } from "@/features/landlords/actions";
export default async function LandlordsPage() {
  const session = await requireOrgRole(["ADMIN", "MANAGER"]);
  if (session.membershipScope?.scopeType !== "ORG") redirect("/access-denied");
  const org = await getOrganizationSummary(session.activeOrgId!);
  return <LandlordDirectory orgId={session.activeOrgId!} organizationName={org?.name ?? "Your organization"} canCreate={memberHasOrgPermission(session, "org.users.manage")} canMap={memberHasOrgPermission(session, "properties.manage")} createAction={createOrgLandlord} mapAction={mapOrgLandlord} manageAction={manageOrgLandlord} returnHref="/dashboard/org/landlords" />;
}
