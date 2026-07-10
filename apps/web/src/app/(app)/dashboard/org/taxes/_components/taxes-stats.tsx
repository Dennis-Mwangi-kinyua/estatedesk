import { formatCurrency } from "../_lib/helpers";
import type { TaxesPageData } from "../_lib/types";
import { StatCard } from "./taxes-ui";

export function TaxesStats({ stats }: Pick<TaxesPageData, "stats">) {
  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Total MRI returns" value={stats.totalReturns} />
        <StatCard label="Draft returns" value={stats.draftReturns} />
        <StatCard label="Submitted" value={stats.submittedReturns} />
        <StatCard label="Acknowledged" value={stats.acknowledgedReturns} />
        <StatCard label="Payment pending" value={stats.paymentPendingReturns} />
        <StatCard label="Paid returns" value={stats.paidReturns} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross rent filed"
          value={formatCurrency(stats.totalGrossRent)}
        />
        <StatCard label="Total tax due" value={formatCurrency(stats.totalTaxDue)} />
        <StatCard label="Nil returns" value={stats.nilReturns} />
        <StatCard label="Active taxpayers" value={stats.activeTaxpayers} />
      </section>
    </div>
  );
}