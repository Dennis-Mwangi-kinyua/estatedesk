import { CaretakerWorkspaceFooter } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerTenantsPageData } from "../_lib/types";
import { TenantsHeader } from "./tenants-header";
import { TenantsList } from "./tenants-list";
import { TenantsSidebar } from "./tenants-sidebar";
import { TenantsStats } from "./tenants-stats";

export function TenantsWorkspace({ data }: { data: CaretakerTenantsPageData }) {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-4 pb-8 sm:space-y-5 lg:space-y-6"
      data-workspace="caretaker"
    >
      <TenantsHeader data={data} />
      <TenantsStats data={data} />

      <div className="min-w-0 space-y-5">
        <div className="min-w-0 space-y-4">
          <TenantsList data={data} />
        </div>
        <div className="min-w-0">
          <TenantsSidebar />
        </div>
      </div>

      <CaretakerWorkspaceFooter note="Tenants in your assigned apartments · Call, message, or open a profile" />
    </div>
  );
}
