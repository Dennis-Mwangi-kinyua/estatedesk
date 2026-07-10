import { Landmark, ReceiptText, Scale, TrendingUp } from "lucide-react";
import { formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { StatCard } from "./accounting-ui";

export function AccountingStats({ data }: { data: AccountingPageData }) {
  const { org, summary } = data;

  if (!summary) {
    return null;
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Income"
        value={formatMoney(summary.income, org.currencyCode)}
        Icon={TrendingUp}
      />
      <StatCard
        label="Expenses"
        value={formatMoney(summary.expenses, org.currencyCode)}
        Icon={ReceiptText}
      />
      <StatCard
        label="Net income"
        value={formatMoney(summary.netIncome, org.currencyCode)}
        Icon={Scale}
      />
      <StatCard
        label="Assets"
        value={formatMoney(summary.assets, org.currencyCode)}
        Icon={Landmark}
      />
    </section>
  );
}