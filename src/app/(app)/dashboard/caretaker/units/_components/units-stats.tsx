import { Building2, Home, Users } from "lucide-react";
import { StatCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerUnitsPageData } from "../_lib/types";

export function UnitsStats({
  data,
}: {
  data: Extract<CaretakerUnitsPageData, { ok: true }>;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard
        label="Assigned units"
        value={data.totalUnits}
        note="Apartments in your scope"
        icon={Building2}
      />
      <StatCard
        label="Occupied"
        value={data.occupiedUnits}
        note="Active tenant occupancy"
        icon={Users}
        highlight={data.occupiedUnits > 0 ? "success" : "default"}
      />
      <StatCard
        label="Vacant"
        value={data.vacantUnits}
        note="Available or turnover units"
        icon={Home}
      />
    </section>
  );
}