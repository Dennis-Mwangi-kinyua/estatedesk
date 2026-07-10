import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { getTenantPortalContext } from "@/lib/tenant/get-tenant-portal-context";
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

  const [data, portalContext] = await Promise.all([
    getTenantLeaseData(session.userId, session.activeOrgId),
    getTenantPortalContext(session.userId, session.activeOrgId, {
      leaseId: null,
    }),
  ]);

  const latestLease = data.latestLease;

  const leasePortalContext = latestLease
    ? await getTenantPortalContext(session.userId, session.activeOrgId, {
        leaseId: latestLease.id,
        unitId: latestLease.unit.id,
        propertyId: latestLease.unit.propertyId,
        buildingId: latestLease.unit.buildingId,
      })
    : portalContext;

  return (
    <LeaseWorkspace data={data} portalContext={leasePortalContext} />
  );
}