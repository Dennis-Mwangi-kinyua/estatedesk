import { vacancyCosts, type VacancyCostsInput } from "@/lib/vacancy-costs";

export function VacancyCostSummary({ costs, currency = "KES" }: { costs: VacancyCostsInput; currency?: string }) {
  const summary = vacancyCosts(costs);
  const money = (value: number) => new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(value);
  return <section className="rounded-2xl border border-border bg-card p-5">
    <h2 className="text-lg font-semibold">Plan your move-in budget</h2>
    <dl className="mt-4 space-y-3 text-sm">{summary.rows.map(row => <div key={row.label} className="flex items-start justify-between gap-4"><dt className="text-muted-foreground">{row.label}</dt><dd className="text-right font-medium">{row.amount === null ? "Confirm with manager" : money(row.amount)}</dd></div>)}</dl>
    <div className="mt-4 flex items-start justify-between gap-4 border-t border-border pt-4"><p className="text-sm font-semibold">{summary.complete ? "Estimated initial cost" : "Known costs subtotal"}</p><p className="font-semibold">{money(summary.knownTotal)}</p></div>
    <p className="mt-3 text-xs leading-5 text-muted-foreground">Includes one month’s rent, the listed deposit and one instance of each listed fee. Confirm fee frequency, utilities and any additional costs with the manager before paying. A viewing request does not reserve a unit.</p>
  </section>;
}
