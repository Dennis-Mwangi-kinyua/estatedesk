import type { CaretakerTenantsPageData } from "../_lib/types";
import { TenantsHeader } from "./tenants-header";
import { TenantsList } from "./tenants-list";
import { TenantsStats } from "./tenants-stats";

export function TenantsWorkspace({ data }: { data: CaretakerTenantsPageData }) {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-4 pb-8 sm:space-y-5 lg:space-y-6"
      data-workspace="caretaker"
    >
      <TenantsHeader data={data} />
      <TenantsStats data={data} />

      <TenantsList data={data} />

    </div>
  );
}
