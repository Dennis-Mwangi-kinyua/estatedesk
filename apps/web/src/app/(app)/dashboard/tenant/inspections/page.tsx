import { PageShell } from "@/components/theme/ed-dashboard-shell";
import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { EmptyState } from "@/app/(app)/dashboard/tenant/inspections/_components/empty-state";
import { HowInspectionsWork } from "@/app/(app)/dashboard/tenant/inspections/_components/how-inspections-work";
import { InspectionsHeader } from "@/app/(app)/dashboard/tenant/inspections/_components/inspections-header";
import { InspectionsHistorySection } from "@/app/(app)/dashboard/tenant/inspections/_components/inspections-history-section";
import { InspectionsStats } from "@/app/(app)/dashboard/tenant/inspections/_components/inspections-stats";
import { getTenantInspectionsData } from "@/app/(app)/dashboard/tenant/inspections/_lib/queries";
import type { TenantInspectionsPageProps } from "@/app/(app)/dashboard/tenant/inspections/_lib/types";

export default async function TenantInspectionsPage({
  searchParams,
}: TenantInspectionsPageProps) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedPage = Number(resolvedSearchParams.page ?? "1");

  const data = await getTenantInspectionsData(
    session.userId,
    session.activeOrgId,
    requestedPage,
  );

  if (!data) {
    return (
      <PageShell>
        <EmptyState />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <InspectionsHeader
          latestInspectionNotice={data.latestInspectionNotice}
        />
        <InspectionsStats totals={data.totals} />
        <InspectionsHistorySection
          preparedNotices={data.preparedNotices}
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          totalNotices={data.totalNotices}
        />
        <HowInspectionsWork />
      </div>
    </PageShell>
  );
}
