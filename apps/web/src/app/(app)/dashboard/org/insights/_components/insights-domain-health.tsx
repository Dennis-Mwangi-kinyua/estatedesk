import type { InsightDomain } from "@/features/insights/lib/smart-insights";
import { INSIGHT_DOMAIN_META } from "../_lib/constants";
import { scoreTone } from "../_lib/helpers";
import type { InsightsPageData } from "../_lib/types";
import { panelShellClassName, ScoreBar } from "./insights-ui";

export function InsightsDomainHealth({ data }: { data: InsightsPageData }) {
  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-foreground">Domain health</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Separate scores for collections, reconciliation, occupancy, maintenance,
          leases, and water.
        </p>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
        {(Object.entries(data.domainScores) as [InsightDomain, number][]).map(
          ([domain, score]) => {
            const meta = INSIGHT_DOMAIN_META[domain];
            const Icon = meta.icon;

            return (
              <div
                key={domain}
                className="rounded-2xl border border-border bg-muted/10 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {meta.label}
                  </div>
                  <span className={`text-sm font-bold ${scoreTone(score)}`}>
                    {score}
                  </span>
                </div>
                <div className="mt-3">
                  <ScoreBar score={score} />
                </div>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}