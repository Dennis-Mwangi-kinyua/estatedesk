import { requireManagementAccess } from "@/lib/permissions/guards";
import { ChargesWorkspace } from "./_components/charges-workspace";
import { getChargesPageData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function OrgChargesPage() {
  const session = await requireManagementAccess();

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const data = await getChargesPageData(session.activeOrgId);

  return <ChargesWorkspace data={data} orgRole={session.activeOrgRole} />;
}