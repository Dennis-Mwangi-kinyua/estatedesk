import { requireManagementAccess } from "@/lib/permissions/guards";
import { loadPropertiesPageData } from "./_lib/queries";
import type { PropertiesPageProps } from "./_lib/types";
import { PropertiesWorkspace } from "./_components/properties-workspace";

export default async function OrgPropertiesPage({
  searchParams,
}: PropertiesPageProps) {
  const session = await requireManagementAccess();
  const data = await loadPropertiesPageData(await searchParams);

  return (
    <PropertiesWorkspace data={data} orgRole={session.activeOrgRole} />
  );
}