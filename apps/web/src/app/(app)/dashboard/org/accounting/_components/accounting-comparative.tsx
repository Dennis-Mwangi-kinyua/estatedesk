import { TrendingDown, TrendingUp } from "lucide-react";
import { formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { panelShellClassName, SectionHeader, StatCard } from "./accounting-ui";

export function AccountingComparative({ data }: { data: AccountingPageData }) {
  const { org, comparative } = data;
  if (!comparative?.mtd || !comparative.priorMonth) return null;

  const { mtd, priorMonth } = comparative;
  const netDelta = mtd.netIncome - priorMonth.netIncome;
  const incomeDelta = mtd.income - priorMonth.income;

  return (
    <section className={panelShellClassName}>
      <SectionHeader
        title="Period comparison"
        description="Month-to-date vs prior calendar month from posted journals."
        action={
          <a
            href="/dashboard/org/accounting/aging/export"
            className="text-xs font-semibold text-primary hover:text-primary/80"
          >
            Export AR/AP aging CSV
          </a>
        }
      />
      <div className="grid grid-cols-2 gap-2.5 px-4 py-4 sm:grid-cols-3 sm:gap-3 sm:px-6 lg:grid-cols-6">
        <StatCard
          label="MTD income"
          value={formatMoney(mtd.income, org.currencyCode)}
          compact
          highlight
        />
        <StatCard
          label="MTD expenses"
          value={formatMoney(mtd.expenses, org.currencyCode)}
          compact
        />
        <StatCard
          label="MTD net"
          value={formatMoney(mtd.netIncome, org.currencyCode)}
          Icon={mtd.netIncome >= 0 ? TrendingUp : TrendingDown}
          compact
        />
        <StatCard
          label="Prior income"
          value={formatMoney(priorMonth.income, org.currencyCode)}
          compact
        />
        <StatCard
          label="Prior expenses"
          value={formatMoney(priorMonth.expenses, org.currencyCode)}
          compact
        />
        <StatCard
          label="Net Δ vs prior"
          value={formatMoney(netDelta, org.currencyCode)}
          compact
          highlight={netDelta !== 0}
        />
      </div>
      <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-6">
        Income change vs prior month:{" "}
        <span className="font-semibold text-foreground">
          {formatMoney(incomeDelta, org.currencyCode)}
        </span>
      </p>
    </section>
  );
}
