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
    <div className="org-theme-content reports-page uniform-page-actions mx-auto w-full min-w-0 max-w-7xl space-y-5 px-0 pb-24 pt-2 sm:px-2">
      <ReportsHeader data={data} orgRole={orgRole} />

      <ReportsFiltersSection data={data} />
      <ReportsStatsSection data={data} />
      <ReportsTenantPanels data={data} orgRole={orgRole} />
      <ReportsMatrixSection data={data} />
      <ReportsExportsSection data={data} />
      <ReportsGuidance orgRole={orgRole} />
    </div>
  );
}
