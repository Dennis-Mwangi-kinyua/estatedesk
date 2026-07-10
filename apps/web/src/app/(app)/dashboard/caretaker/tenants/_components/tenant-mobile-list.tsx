import type { CaretakerTenantsPageData } from "../_lib/types";
import { TenantCard } from "./tenant-card";

type TenantMobileListProps = {
  tenants: CaretakerTenantsPageData["tenants"];
};

/** Single-column mobile cards; 2-up on tablet; desktop uses the table. */
export function TenantMobileList({ tenants }: TenantMobileListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
      {tenants.map((tenant) => (
        <TenantCard key={tenant.id} tenant={tenant} />
      ))}
    </div>
  );
}
