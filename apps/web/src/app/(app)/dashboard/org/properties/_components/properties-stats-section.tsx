import type { PropertiesPageData } from "../_lib/types";
import { StatCard } from "./properties-ui";

export function PropertiesStatsSection({ data }: { data: PropertiesPageData }) {
  const {
    overallProperties,
    activeProperties,
    totalBuildingsAggregate,
    totalUnitsAggregate,
  } = data;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total properties" value={overallProperties} />
      <StatCard
        label="Active"
        value={activeProperties}
        highlight={activeProperties > 0 ? "success" : "default"}
        note="Currently enabled"
      />
      <StatCard label="Buildings" value={totalBuildingsAggregate} />
      <StatCard label="Units" value={totalUnitsAggregate} note="Across portfolio" />
    </section>
  );
}