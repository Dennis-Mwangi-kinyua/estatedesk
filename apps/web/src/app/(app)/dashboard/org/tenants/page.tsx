import { requireManagementAccess } from "@/lib/permissions/guards";
import { TenantsWorkspace } from "./_components/tenants-workspace";
import { Notice } from "./_components/tenants-ui";
import { loadTenantsPageData } from "./_lib/queries";
import type { TenantsPageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function OrgTenantsPage({ searchParams }: TenantsPageProps) {
  const session = await requireManagementAccess();

  if (!session.activeOrgId) {
    return <Notice tone="warning">No active organisation found for your account.</Notice>;
  }

  const data = await loadTenantsPageData(session.activeOrgId, await searchParams);

  return <TenantsWorkspace data={data} orgRole={session.activeOrgRole} />;
}