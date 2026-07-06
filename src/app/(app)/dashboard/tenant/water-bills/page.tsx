import { PageShell } from "@/components/theme/ed-dashboard-shell";
import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { BillsHistorySection } from "@/app/(app)/dashboard/tenant/water-bills/_components/bills-history-section";
import { EmptyState } from "@/app/(app)/dashboard/tenant/water-bills/_components/empty-state";
import { RecentBillsSection } from "@/app/(app)/dashboard/tenant/water-bills/_components/recent-bills-section";
import { WaterBillsHeader } from "@/app/(app)/dashboard/tenant/water-bills/_components/water-bills-header";
import { WaterBillsStats } from "@/app/(app)/dashboard/tenant/water-bills/_components/water-bills-stats";
import { clampPage } from "@/app/(app)/dashboard/tenant/water-bills/_lib/helpers";
import { getTenantWaterBillsData } from "@/app/(app)/dashboard/tenant/water-bills/_lib/queries";
import type { TenantWaterBillsPageProps } from "@/app/(app)/dashboard/tenant/water-bills/_lib/types";

export default async function TenantWaterBillsPage({
  searchParams,
}: TenantWaterBillsPageProps) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedPage = Number(resolvedSearchParams.page ?? "1");

  const data = await getTenantWaterBillsData(
    session.userId,
    session.activeOrgId,
  );

  if (!data) {
    return (
      <PageShell>
        <EmptyState />
      </PageShell>
    );
  }

  const currentPage = clampPage(requestedPage, data.totalPages);

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <WaterBillsHeader latestBill={data.latestBill} />
        <WaterBillsStats totals={data.totals} />
        <RecentBillsSection preparedBills={data.preparedBills} />
        <BillsHistorySection
          preparedBills={data.preparedBills}
          currentPage={currentPage}
          totalPages={data.totalPages}
        />
      </div>
    </PageShell>
  );
}