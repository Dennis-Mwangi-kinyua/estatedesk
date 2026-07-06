import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { LeaseWorkspace } from "./_components/lease-workspace";
import { getTenantLeaseData } from "./_lib/queries";

export default async function TenantLeasePage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const data = await getTenantLeaseData(session.userId, session.activeOrgId);

  return <LeaseWorkspace data={data} />;
}