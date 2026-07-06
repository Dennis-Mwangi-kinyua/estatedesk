import { requireOrgRole } from "@/lib/permissions/guards";
import { ResolutionReportsWorkspace } from "./_components/resolution-reports-workspace";
import { getResolutionReportsQueueData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function ResolutionReportsQueuePage() {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE"]);
  const data = await getResolutionReportsQueueData(session.activeOrgId!);

  return (
    <ResolutionReportsWorkspace
      data={data}
      orgRole={session.activeOrgRole}
    />
  );
}