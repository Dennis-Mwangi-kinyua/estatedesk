import type { OrgRole } from "@prisma/client";
import type { ReportsPageData } from "../_lib/types";
import { ReportsExportsSection } from "./reports-exports-section";
import { ReportsFiltersSection } from "./reports-filters-section";
import { ReportsGuidance } from "./reports-guidance";
import { ReportsHeader } from "./reports-header";
import { ReportsMatrixSection } from "./reports-matrix-section";
import { ReportsStatsSection } from "./reports-stats-section";
import { ReportsTenantPanels } from "./reports-tenant-panels";

export function ReportsWorkspace({
  data,
  orgRole,
}: {
  data: ReportsPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <ReportsHeader data={data} orgRole={orgRole} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <ReportsExportsSection data={data} />
          <ReportsFiltersSection data={data} />
          <ReportsStatsSection data={data} />
          <ReportsTenantPanels data={data} orgRole={orgRole} />
          <ReportsMatrixSection data={data} />
        </div>
        <ReportsGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}