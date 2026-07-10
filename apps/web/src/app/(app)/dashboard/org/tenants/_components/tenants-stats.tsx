import type { TenantsPageData } from "../_lib/types";
import { StatCard } from "./tenants-ui";

export function TenantsStats({ data }: { data: TenantsPageData }) {
  const { stats } = data;
  const totalTenants =
    stats.activeTenants + stats.inactiveTenants + stats.blacklistedTenants;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="All tenants" value={totalTenants} />
      <StatCard
        label="Active"
        value={stats.activeTenants}
        highlight={stats.activeTenants > 0 ? "success" : "default"}
        note="Currently linked"
      />
      <StatCard label="Inactive" value={stats.inactiveTenants} note="Not in active use" />
      <StatCard
        label="Blacklisted"
        value={stats.blacklistedTenants}
        highlight={stats.blacklistedTenants > 0 ? "warning" : "default"}
        note="Restricted tenancy"
      />
      <StatCard
        label="Assigned units"
        value={stats.assignedTenants}
        note="With active lease"
      />
    </section>
  );
}