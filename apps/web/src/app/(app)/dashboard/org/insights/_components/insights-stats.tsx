import { AlertTriangle, Gauge } from "lucide-react";
import { formatLedgerCurrency } from "@/lib/ledger";
import type { InsightsPageData } from "../_lib/types";
import { StatCard } from "./insights-ui";

export function InsightsStats({ data }: { data: InsightsPageData }) {
  const { snapshot } = data;

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Portfolio score"
        value={
          <>
            {data.score}
            <span className="text-base font-medium text-muted-foreground">/100</span>
          </>
        }
        highlight={
          data.score >= 80 ? "success" : data.score >= 60 ? "warning" : "default"
        }
        icon={<Gauge className="h-4 w-4" />}
      />
      <StatCard
        label="Collection rate"
        value={`${data.collectionRate}%`}
        note={`${formatLedgerCurrency(snapshot.collections.deficit)} outstanding`}
        highlight={data.collectionRate >= 80 ? "success" : "warning"}
      />
      <StatCard
        label="Occupancy"
        value={`${data.occupancyRate}%`}
        note={`${snapshot.occupancy.vacantUnits} vacant unit${snapshot.occupancy.vacantUnits === 1 ? "" : "s"}`}
        highlight={data.occupancyRate >= 80 ? "success" : "default"}
      />
      <StatCard
        label="Priority actions"
        value={data.attentionCount}
        note="Critical or high priority"
        highlight={data.attentionCount > 0 ? "warning" : "success"}
        icon={<AlertTriangle className="h-4 w-4" />}
      />
    </section>
  );
}