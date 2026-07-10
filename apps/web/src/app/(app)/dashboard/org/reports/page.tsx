import { requireManagementAccess } from "@/lib/permissions/guards";
import { loadReportsPageData } from "./_lib/queries";
import type { OrgReportsPageProps } from "./_lib/types";
import { ReportsWorkspace } from "./_components/reports-workspace";

export const dynamic = "force-dynamic";

export default async function OrgReportsPage({
  searchParams,
}: OrgReportsPageProps) {
  const session = await requireManagementAccess();
  const resolvedSearchParams = await searchParams;
  const data = await loadReportsPageData(
    session.activeOrgId!,
    resolvedSearchParams,
  );

  return <ReportsWorkspace data={data} orgRole={session.activeOrgRole} />;
}