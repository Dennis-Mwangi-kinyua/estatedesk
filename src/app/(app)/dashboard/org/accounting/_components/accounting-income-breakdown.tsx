import { Droplets, Home, TrendingUp } from "lucide-react";
import { formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { StatCard, panelShellClassName } from "./accounting-ui";

export function AccountingIncomeBreakdown({ data }: { data: AccountingPageData }) {
  const { org, summary } = data;

  if (!summary) {
    return null;
  }

  const { controlBalances, income, expenses, netIncome } = summary;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Income statement (YTD)
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Rental and operating income compared with expenses for the current fiscal year.
        </p>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-5 sm:px-6">
        <StatCard
          label="Rent income"
          value={formatMoney(controlBalances.rentIncome, org.currencyCode)}
          Icon={Home}
        />
        <StatCard
          label="Water income"
          value={formatMoney(controlBalances.waterIncome, org.currencyCode)}
          Icon={Droplets}
        />
        <StatCard
          label="Total income"
          value={formatMoney(income, org.currencyCode)}
          Icon={TrendingUp}
        />
        <StatCard
          label="Total expenses"
          value={formatMoney(expenses, org.currencyCode)}
        />
        <StatCard
          label="Net income"
          value={formatMoney(netIncome, org.currencyCode)}
        />
      </div>
    </section>
  );
}