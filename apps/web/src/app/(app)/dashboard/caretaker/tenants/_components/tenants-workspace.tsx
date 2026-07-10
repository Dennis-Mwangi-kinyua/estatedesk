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

      {/* Mobile: quick links first, then list. Desktop: list + sticky sidebar */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-5">
        <div className="order-2 min-w-0 space-y-4 lg:order-1">
          <TenantsList data={data} />
        </div>
        <div className="order-1 lg:order-2 lg:sticky lg:top-4">
          <TenantsSidebar />
        </div>
      </div>

      <CaretakerWorkspaceFooter note="Tenants in your assigned apartments · Call, message, or open a profile" />
    </div>
  );
}
