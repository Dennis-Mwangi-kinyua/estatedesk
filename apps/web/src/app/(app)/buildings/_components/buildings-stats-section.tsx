import type { getBuildingsPageData } from "../_lib/queries";
import { StatCard } from "./buildings-ui";

type BuildingsPageData = Awaited<ReturnType<typeof getBuildingsPageData>>;

export function BuildingsStatsSection({ data }: { data: BuildingsPageData }) {
  const { totalBuildings, activeBuildings, totalUnits, occupiedUnits, vacantUnits } = data;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Buildings"
        value={totalBuildings}
        note={`${activeBuildings} active`}
      />
      <StatCard label="Units" value={totalUnits} note="Across visible buildings" />
      <StatCard
        label="Occupied"
        value={occupiedUnits}
        highlight={occupiedUnits > 0 ? "success" : "default"}
        note="Currently occupied"
      />
      <StatCard
        label="Vacant"
        value={vacantUnits}
        highlight={vacantUnits > 0 ? "warning" : "default"}
        note="Ready for leasing"
      />
    </section>
  );
}