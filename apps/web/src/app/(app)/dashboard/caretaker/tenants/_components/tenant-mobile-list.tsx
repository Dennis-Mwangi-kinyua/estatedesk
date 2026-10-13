import type { CaretakerTenantsPageData } from "../_lib/types";
import { TenantCard } from "./tenant-card";

type TenantMobileListProps = {
  tenants: CaretakerTenantsPageData["tenants"];
};

/** The same readable tenant cards across mobile and desktop. */
export function TenantMobileList({ tenants }: TenantMobileListProps) {
  return (
    <div className="caretaker-card-grid">
      {tenants.map((tenant) => (
        <TenantCard key={tenant.id} tenant={tenant} />
      ))}
    </div>
  );
}
