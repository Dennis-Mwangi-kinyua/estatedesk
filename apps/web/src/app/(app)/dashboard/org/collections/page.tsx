import { ManagementWorkspace, type ManagementQuery } from "@/features/org-management/workspace";
import { requireOrgManagement } from "@/features/org-management/access";
import { collectionsData, type CollectionQuery } from "@/features/collections/queries";
import { CollectionsView } from "@/features/collections/view";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
export const dynamic = "force-dynamic";
export default async function Page({searchParams}:{searchParams:Promise<CollectionQuery & ManagementQuery>}) {
  const query=await searchParams;
  if(query.view==="promises"||query.status)return <ManagementWorkspace section="collections" query={query}/>;
  const session=await requireOrgManagement("collections");
  return <CollectionsView data={await collectionsData(session,query)} canRemind={canAccessWorkspacePath(session,"/dashboard/org/notifications")} canSetup={canAccessWorkspacePath(session,"/dashboard/org/setup")} canTenantRecords={canAccessWorkspacePath(session,"/dashboard/org/tenants")}/>;
}
