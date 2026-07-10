import { requireManagementAccess } from "@/lib/permissions/guards";
import { InspectionsWorkspace } from "./_components/inspections-workspace";
import { getOrgInspectionsPageData } from "./_lib/queries";
import type { InspectionsPageProps } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function OrgInspectionsPage({
  searchParams,
}: InspectionsPageProps) {
  const session = await requireManagementAccess();
  const resolved = (await searchParams) ?? {};
  const data = await getOrgInspectionsPageData(
    session.activeOrgId!,
    Number(resolved.page ?? "1"),
  );

  return (
    <InspectionsWorkspace data={data} orgRole={session.activeOrgRole} />
  );
}