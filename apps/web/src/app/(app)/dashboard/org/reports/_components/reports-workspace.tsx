import type { OrgRole } from "@prisma/client";
import type { ReportsPageData } from "../_lib/types";
import { ReportsExportsSection } from "./reports-exports-section";
import { ReportsFiltersSection } from "./reports-filters-section";
import { ReportsGuidance } from "./reports-guidance";
import { ReportsHeader } from "./reports-header";
import { ReportsMatrixSection } from "./reports-matrix-section";
import { ReportsStatsSection } from "./reports-stats-section";
import { ReportsTenantPanels } from "./reports-tenant-panels";
import Link from "@/components/navigation/workspace-link";
import { reportFilterHref } from "../_lib/helpers";

export function ReportsWorkspace({
  data,
  orgRole,
}: {
  data: ReportsPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content reports-page uniform-page-actions mx-auto w-full min-w-0 max-w-7xl space-y-5 px-0 pb-24 pt-2 sm:px-2">
      <ReportsHeader data={data} orgRole={orgRole} />

      <ReportsFiltersSection data={data} />
      <ReportsStatsSection data={data} />
      <ReportsTenantPanels data={data} orgRole={orgRole} />
      <ReportsMatrixSection data={data} />
      <nav aria-label="Report pages" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm">
        <p>Page {data.pagination.page} of {data.pagination.pageCount} · {data.pagination.totalRows} matching tenants. Totals cover all matches.</p>
        {data.pagination.page > 1 && <Link className="inline-flex min-h-11 items-center underline" href={reportFilterHref({ apartment: data.selectedApartment, payment: data.selectedPayment, period: data.period, page: data.pagination.page - 1 })}>Previous page</Link>}
        {data.pagination.page < data.pagination.pageCount && <Link className="inline-flex min-h-11 items-center underline" href={reportFilterHref({ apartment: data.selectedApartment, payment: data.selectedPayment, period: data.period, page: data.pagination.page + 1 })}>Next page</Link>}
      </nav>
      <ReportsExportsSection data={data} />
      <ReportsGuidance orgRole={orgRole} />
    </div>
  );
}
