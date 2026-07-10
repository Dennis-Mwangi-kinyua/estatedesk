import { DeferredLink } from "@/components/navigation/app-links";
import { ArrowRight } from "lucide-react";
import { INSIGHT_DOMAIN_META } from "../_lib/constants";
import { severityClasses } from "../_lib/helpers";
import type { InsightsPageData } from "../_lib/types";
import { panelShellClassName } from "./insights-ui";

export function InsightsRecommendations({ data }: { data: InsightsPageData }) {
  const { recommendations } = data;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Recommended next actions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Highest impact work appears first.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {recommendations.length} recommendation
            {recommendations.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {recommendations.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {recommendations.map((recommendation) => {
              const meta = INSIGHT_DOMAIN_META[recommendation.domain];
              const Icon = meta.icon;

              return (
                <article
                  key={recommendation.id}
                  className="rounded-2xl border border-border bg-muted/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      <Icon className="h-4 w-4 shrink-0" />
                      {meta.label}
                    </div>
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${severityClasses[recommendation.severity]}`}
                    >
                      {recommendation.severity.toLowerCase()}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-foreground">
                    {recommendation.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {recommendation.summary}
                  </p>
                  <div className="mt-4 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Evidence: {recommendation.evidence}
                    </p>
                    <DeferredLink
                      href={recommendation.href}
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary transition hover:text-primary/80"
                    >
                      {recommendation.actionLabel}
                      <ArrowRight className="h-4 w-4" />
                    </DeferredLink>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            No material exceptions detected. The portfolio is operating within the
            current rules.
          </div>
        )}
      </div>
    </section>
  );
}