import { BadgeCheck, Ban, UserRound, Users } from "lucide-react";
import { StatCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerTenantsPageData } from "../_lib/types";

export function TenantsStats({
  data,
}: {
  data: Pick<
    CaretakerTenantsPageData,
    "totalTenants" | "activeTenants" | "inactiveTenants" | "blacklistedTenants"
  >;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total tenants"
        value={data.totalTenants}
        note="Assigned to your scope"
        icon={Users}
      />
      <StatCard
        label="Active"
        value={data.activeTenants}
        note="Currently in occupancy"
        icon={BadgeCheck}
        highlight={data.activeTenants > 0 ? "success" : "default"}
      />
      <StatCard
        label="Inactive"
        value={data.inactiveTenants}
        note="No active lease link"
        icon={UserRound}
      />
      <StatCard
        label="Flagged"
        value={data.blacklistedTenants}
        note="Requires caution"
        icon={Ban}
        highlight={data.blacklistedTenants > 0 ? "warning" : "default"}
      />
    </section>
  );
}