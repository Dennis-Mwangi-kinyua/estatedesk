import type { OrgRole } from "@prisma/client";
import type { PropertiesPageData } from "../_lib/types";
import { PropertiesCreatedBanner } from "./properties-created-banner";
import { PropertiesDirectorySection } from "./properties-directory-section";
import { PropertiesFiltersSection } from "./properties-filters-section";
import { PropertiesGuidance } from "./properties-guidance";
import { PropertiesHeaderSection } from "./properties-header-section";
import { PropertiesStatsSection } from "./properties-stats-section";

export function PropertiesWorkspace({
  data,
  orgRole,
}: {
  data: PropertiesPageData;
  orgRole?: OrgRole | null;
}) {
  const { created } = data;

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <PropertiesHeaderSection data={data} orgRole={orgRole} />
      <PropertiesStatsSection data={data} />
      {created ? <PropertiesCreatedBanner /> : null}
      <PropertiesFiltersSection data={data} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <PropertiesDirectorySection data={data} />
        <PropertiesGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}