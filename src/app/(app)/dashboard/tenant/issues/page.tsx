import { PageShell } from "@/components/theme/ed-dashboard-shell";
import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { EmptyState } from "@/app/(app)/dashboard/tenant/issues/_components/empty-state";
import { IssuesHeader } from "@/app/(app)/dashboard/tenant/issues/_components/issues-header";
import { IssuesHistorySection } from "@/app/(app)/dashboard/tenant/issues/_components/issues-history-section";
import { IssuesStats } from "@/app/(app)/dashboard/tenant/issues/_components/issues-stats";
import { LatestIssueCard } from "@/app/(app)/dashboard/tenant/issues/_components/latest-issue-card";
import { clampPage } from "@/app/(app)/dashboard/tenant/issues/_lib/helpers";
import { getTenantIssuesData } from "@/app/(app)/dashboard/tenant/issues/_lib/queries";
import type { TenantIssuesPageProps } from "@/app/(app)/dashboard/tenant/issues/_lib/types";

export default async function TenantIssuesPage({
  searchParams,
}: TenantIssuesPageProps) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedPage = Number(resolvedSearchParams.page ?? "1");

  const data = await getTenantIssuesData(session.userId, session.activeOrgId);

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
        <IssuesHeader data={data} />
        <IssuesStats data={data} />
        <LatestIssueCard data={data} />
        <IssuesHistorySection data={data} currentPage={currentPage} />
      </div>
    </PageShell>
  );
}