import { getCurrentTenantWithActiveLease } from "@/lib/tenant/get-current-tenant";
import { getTenantDashboardData } from "@/lib/tenant/get-tenant-dashboard-data";
import { getTenantPortalContext } from "@/lib/tenant/get-tenant-portal-context";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TenantDashboardInactive } from "./_components/tenant-dashboard-inactive";
import { TenantDashboardWorkspace } from "./_components/tenant-dashboard-workspace";

export const dynamic = "force-dynamic";

export default async function TenantDashboardPage() {
  const tenant = await getCurrentTenantWithActiveLease();

  if (!tenant) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
        No tenant profile is linked to your account.
      </div>
    );
  }

  const activeLease = tenant.leases[0];
  const unit = activeLease?.unit;

  if (!activeLease) {
    const history = await prisma.tenantHistoryRecord.findMany({
      where: {
        tenantId: tenant.id,
      },
      orderBy: {
        moveOutDate: "desc",
      },
      take: 12,
      include: {
        org: {
          select: {
            name: true,
          },
        },
      },
    });

    return <TenantDashboardInactive history={history} />;
  }

  const session = await requireUserSession();
  const [dashboardData, portalContext] = await Promise.all([
    getTenantDashboardData(tenant.id, unit?.id),
    getTenantPortalContext(session.userId, tenant.orgId, {
      leaseId: activeLease.id,
      unitId: unit?.id,
      propertyId: unit?.propertyId,
      buildingId: unit?.buildingId,
    }),
  ]);

  return (
    <TenantDashboardWorkspace
      data={{
        fullName: tenant.fullName,
        propertyName: unit?.property?.name,
        buildingName: unit?.building?.name,
        houseNo: unit?.houseNo,
        leaseStatus: activeLease.status,
        monthlyRent: activeLease.monthlyRent,
        dueDay: activeLease.dueDay,
        images: unit?.images ?? [],
        recentPayments: dashboardData.recentPayments,
        waterBills: dashboardData.waterBills,
        notifications: dashboardData.notifications,
        issues: dashboardData.issues,
        portalContext,
      }}
    />
  );
}