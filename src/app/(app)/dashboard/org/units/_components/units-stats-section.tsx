import type { UnitsPageData } from "../_lib/types";
import { StatCard } from "./units-ui";

export function UnitsStatsSection({ data }: { data: UnitsPageData }) {
  const { totalUnits, activeUnits, occupiedUnits, vacantUnits } = data;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total units" value={totalUnits} note="Across all properties" />
      <StatCard
        label="Active units"
        value={activeUnits}
        highlight={activeUnits > 0 ? "success" : "default"}
        note="Currently enabled"
      />
      <StatCard
        label="Occupied"
        value={occupiedUnits}
        note="Portfolio wide"
      />
      <StatCard
        label="Vacant"
        value={vacantUnits}
        highlight={vacantUnits > 0 ? "warning" : "default"}
        note="Ready to fill"
      />
    </section>
  );
}