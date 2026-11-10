import type { SaasMetrics } from "@/lib/workflow/saas-metrics";
import { formatMetricDays, formatMetricHours, formatMetricShare } from "@/lib/workflow/saas-metrics";

const cards = [
  { label: "Signup to first unit", key: "hours", hint: "From the workspace being created to the first unit." },
  { label: "First unit to first bill", key: "days", hint: "From that unit to the first rent charge." },
  { label: "Settled without a person", key: "auto", hint: "Instant M-Pesa settlements compared with proofs still waiting." },
  { label: "Bills reconciled in 7 days", key: "reconciled", hint: "Rent charges paid within seven days of being issued." },
] as const;

export function SaasMetricsPanel({ metrics }: { metrics: SaasMetrics }) {
  const values: Record<(typeof cards)[number]["key"], string> = {
    hours: formatMetricHours(metrics.hoursSignupToFirstUnit),
    days: formatMetricDays(metrics.daysFirstUnitToFirstBill),
    auto: metrics.autoSettledShare === null ? "Not yet" : `${formatMetricShare(metrics.autoSettledShare)} · ${metrics.settledWithoutReview} settled, ${metrics.pendingProofs} waiting`,
    reconciled: metrics.reconciledWithinSevenDaysShare === null ? "Not yet" : `${formatMetricShare(metrics.reconciledWithinSevenDaysShare)} · ${metrics.reconciledWithinSevenDays} of ${metrics.eligibleBills}`,
  };
  return (
    <section className="rounded-2xl border border-border bg-card p-4" aria-labelledby="saas-metrics-title">
      <h2 id="saas-metrics-title" className="font-semibold">Workspace pace</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">Four numbers for this organisation. {metrics.chargeSampleLimited ? "Bill reconciliation uses the latest 500 rent charges." : "Bill reconciliation uses every rent charge."}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <div key={card.key} className="rounded-xl border border-border p-3">
            <dt className="text-sm text-muted-foreground">{card.label}</dt>
            <dd className="mt-1 text-lg font-semibold">{values[card.key]}</dd>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.hint}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
