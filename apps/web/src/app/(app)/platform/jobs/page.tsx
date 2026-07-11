import { getIntegrationReadinessReport } from "@/lib/integrations";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { JobsWorkspace } from "./_components/jobs-workspace";
import { buildJobsQueryParams, buildReturnTo, getPageNumber, getPageSize } from "./_lib/helpers";
import { getJobsPageData } from "./_lib/queries";
import type { JobsSearchParams } from "./_lib/types";

export const dynamic = "force-dynamic";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: JobsSearchParams;
}) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const resolved = await searchParams;
  const q = resolved.q?.trim() ?? "";
  const jobStatus = resolved.jobStatus?.trim() ?? "";
  const pageSize = getPageSize(resolved.pageSize);
  const queuedPage = getPageNumber(resolved.queuedPage);
  const failedPage = getPageNumber(resolved.failedPage);
  const kraPage = getPageNumber(resolved.kraPage);
  const runsPage = getPageNumber(resolved.runsPage);
  const queryParams = buildJobsQueryParams({
    q,
    jobStatus,
    pageSize,
    queuedPage,
    failedPage,
    kraPage,
    runsPage,
  });

  const returnTo = buildReturnTo(queryParams);
  const data = await getJobsPageData({
    q,
    jobStatus,
    pageSize,
    queuedPage,
    failedPage,
    kraPage,
    runsPage,
  });
  const integrationReadiness = getIntegrationReadinessReport();

  return (
    <JobsWorkspace
      data={data}
      filters={{ q, jobStatus, pageSize, queuedPage, failedPage, kraPage, runsPage }}
      queryParams={queryParams}
      returnTo={returnTo}
      integrationReadiness={integrationReadiness}
    />
  );
}
