import { BadgeCheck, Ban } from "lucide-react";
import { UserRound, UsersRound as Users } from "@/components/shared/colored-icons";
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
    <section className="workspace-card-grid grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        label="Total"
        value={data.totalTenants}
        note="In your scope"
        icon={Users}
      />
      <StatCard
        label="Active"
        value={data.activeTenants}
        note="Currently occupying"
        icon={BadgeCheck}
        highlight={data.activeTenants > 0 ? "success" : "default"}
      />
      <StatCard
        label="Inactive"
        value={data.inactiveTenants}
        note="Not active now"
        icon={UserRound}
      />
      <StatCard
        label="Flagged"
        value={data.blacklistedTenants}
        note="Handle carefully"
        icon={Ban}
        highlight={data.blacklistedTenants > 0 ? "warning" : "default"}
      />
    </section>
  );
}
