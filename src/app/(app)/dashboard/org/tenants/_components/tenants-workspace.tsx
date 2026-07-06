import type { OrgRole } from "@prisma/client";
import type { TenantsPageData } from "../_lib/types";
import { TenantsDirectorySection } from "./tenants-directory-section";
import { TenantsFiltersSection } from "./tenants-filters-section";
import { TenantsGuidance } from "./tenants-guidance";
import { TenantsHeader } from "./tenants-header";
import { TenantsStats } from "./tenants-stats";
import { Notice } from "./tenants-ui";

export function TenantsWorkspace({
  data,
  orgRole,
}: {
  data: TenantsPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <TenantsHeader data={data} orgRole={orgRole} />
      <TenantsStats data={data} />

      {data.created ? (
        <Notice tone="success">
          Tenant created successfully. If a unit was selected during creation, it has
          already been mapped through an active lease.
        </Notice>
      ) : null}

      <TenantsFiltersSection data={data} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <TenantsDirectorySection data={data} />
        <TenantsGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}