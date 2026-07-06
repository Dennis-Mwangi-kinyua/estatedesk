import { redirect } from "next/navigation";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { ReportIssueWorkspace } from "./_components/report-issue-workspace";
import { getReportIssuePageData } from "./_lib/queries";
import type { ReportIssuePageProps } from "./_lib/types";

export default async function TenantReportIssuePage({
  searchParams,
}: ReportIssuePageProps) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const result = await getReportIssuePageData(
    session.userId,
    session.activeOrgId,
    resolvedSearchParams,
  );

  if (!result) {
    redirect("/dashboard/tenant/issues?error=tenant_not_found");
  }

  return <ReportIssueWorkspace data={result.data} />;
}