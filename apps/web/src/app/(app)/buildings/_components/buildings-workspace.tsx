import { PortfolioHierarchy } from "@/components/portfolio/portfolio-hierarchy";
import type { OrgRole } from "@prisma/client";
import type { getBuildingsPageData } from "../_lib/queries";
import { BuildingsDirectorySection } from "./buildings-directory-section";
import { BuildingsFiltersSection } from "./buildings-filters-section";
import { BuildingsGuidance } from "./buildings-guidance";
import { BuildingsHeader } from "./buildings-header";
import { BuildingsStatsSection } from "./buildings-stats-section";

export type BuildingsWorkspaceProps = {
  data: Awaited<ReturnType<typeof getBuildingsPageData>>;
  orgRole?: OrgRole | null;
};

export function BuildingsWorkspace({ data, orgRole }: BuildingsWorkspaceProps) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <BuildingsHeader data={data} orgRole={orgRole} />
      <PortfolioHierarchy />
      <BuildingsStatsSection data={data} />
      <BuildingsFiltersSection data={data} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <BuildingsDirectorySection data={data} />
        <BuildingsGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}