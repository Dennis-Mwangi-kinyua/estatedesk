import { getCurrentTenantWithActiveLease } from "@/lib/tenant/get-current-tenant";
import { getTenantDashboardData } from "@/lib/tenant/get-tenant-dashboard-data";
import { TenantDashboardHero } from "./_components/tenant-dashboard-hero";
import { TenantDashboardStats } from "./_components/tenant-dashboard-stats";
import { TenantDashboardOverview } from "./_components/tenant-dashboard-overview";
import { TenantDashboardQuickActions } from "./_components/tenant-dashboard-quick-actions";
import { TenantDashboardPayments } from "./_components/tenant-dashboard-payments";
import { TenantDashboardUpdates } from "./_components/tenant-dashboard-updates";

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

  const { recentPayments, waterBills, notifications, issues } =
    await getTenantDashboardData(tenant.id, unit?.id);

  const latestWaterBill = waterBills[0];
  const lastPayment = recentPayments[0];
  const openIssuesCount = issues.filter(
    (issue) => issue.status !== "RESOLVED" && issue.status !== "CLOSED"
  ).length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <TenantDashboardHero
        fullName={tenant.fullName}
        propertyName={unit?.property?.name}
        buildingName={unit?.building?.name}
        houseNo={unit?.houseNo}
        leaseStatus={activeLease?.status}
      />

      <TenantDashboardStats
        monthlyRent={activeLease?.monthlyRent}
        dueDay={activeLease?.dueDay}
        latestWaterBill={latestWaterBill}
        lastPayment={lastPayment}
        openIssuesCount={openIssuesCount}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <TenantDashboardOverview
          propertyName={unit?.property?.name}
          buildingName={unit?.building?.name}
          houseNo={unit?.houseNo}
          leaseStatus={activeLease?.status}
        />
        <TenantDashboardQuickActions />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TenantDashboardPayments recentPayments={recentPayments} />
        <TenantDashboardUpdates
          notifications={notifications}
          issues={issues}
        />
      </section>
    </div>
  );
}