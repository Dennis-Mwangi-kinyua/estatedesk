import { requireManagementAccess } from "@/lib/permissions/guards";
import { SupportWorkspace } from "./_components/support-workspace";
import { getSupportPageData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function OrgSupportPage() {
  const session = await requireManagementAccess();

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const data = await getSupportPageData(session.activeOrgId);

  return <SupportWorkspace data={data} orgRole={session.activeOrgRole} />;
}