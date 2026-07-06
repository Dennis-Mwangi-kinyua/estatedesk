import { requireManagementAccess } from "@/lib/permissions/guards";
import { InsightsWorkspace } from "./_components/insights-workspace";
import { getInsightsPageData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function SmartInsightsPage() {
  const session = await requireManagementAccess();

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const data = await getInsightsPageData(session.activeOrgId);

  return <InsightsWorkspace data={data} orgRole={session.activeOrgRole} />;
}