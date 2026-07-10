import type { OrgRole } from "@prisma/client";
import type { UnitsPageData } from "../_lib/types";
import { UnitsBreadcrumb } from "./units-breadcrumb";
import { UnitsEmptyState } from "./units-empty-state";
import { UnitsFiltersSection } from "./units-filters-section";
import { UnitsGuidance } from "./units-guidance";
import { UnitsHeaderSection } from "./units-header-section";
import { UnitsMixGroupsSection } from "./units-mix-groups-section";
import { UnitsPaginationSection } from "./units-pagination-section";
import { UnitsPropertyDirectorySection } from "./units-property-directory-section";
import { UnitsStatsSection } from "./units-stats-section";
import { UnitsUnitListSection } from "./units-unit-list-section";

function hasPageContent(data: UnitsPageData) {
  if (data.view === "properties") {
    return data.propertyDirectory.length > 0;
  }

  if (data.view === "mixes") {
    return data.unitMixGroups.length > 0;
  }

  return data.units.length > 0;
}

export function UnitsWorkspace({
  data,
  orgRole,
}: {
  data: UnitsPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <UnitsHeaderSection data={data} orgRole={orgRole} />
      <UnitsStatsSection data={data} />
      <UnitsFiltersSection data={data} />
      <UnitsBreadcrumb data={data} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {!hasPageContent(data) ? (
            <UnitsEmptyState data={data} orgRole={orgRole} />
          ) : (
            <>
              {data.view === "properties" ? (
                <UnitsPropertyDirectorySection data={data} />
              ) : null}
              {data.view === "mixes" ? (
                <UnitsMixGroupsSection data={data} />
              ) : null}
              {data.view === "units" ? <UnitsUnitListSection data={data} /> : null}
              <UnitsPaginationSection data={data} />
            </>
          )}
        </div>

        <UnitsGuidance data={data} orgRole={orgRole} />
      </div>
    </div>
  );
}