import { CaretakerWorkspaceFooter } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerTenantsPageData } from "../_lib/types";
import { TenantsHeader } from "./tenants-header";
import { TenantsList } from "./tenants-list";
import { TenantsSidebar } from "./tenants-sidebar";
import { TenantsStats } from "./tenants-stats";

export function TenantsWorkspace({ data }: { data: CaretakerTenantsPageData }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <TenantsHeader data={data} />
      <TenantsStats data={data} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <TenantsList data={data} />
        <TenantsSidebar />
      </div>

      <CaretakerWorkspaceFooter note="Allocation-based tenant records for caretakers" />
    </div>
  );
}