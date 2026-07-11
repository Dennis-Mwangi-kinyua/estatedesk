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

      <div className="flex gap-2.5 overflow-x-auto px-4 py-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-6 xl:grid-cols-3">
        {(
          [
            {
              label: "Rent income",
              value: formatMoney(controlBalances.rentIncome, org.currencyCode),
              Icon: Home,
            },
            {
              label: "Water income",
              value: formatMoney(controlBalances.waterIncome, org.currencyCode),
              Icon: Droplets,
            },
            {
              label: "Total income",
              value: formatMoney(income, org.currencyCode),
              Icon: TrendingUp,
              highlight: true,
            },
            {
              label: "Total expenses",
              value: formatMoney(expenses, org.currencyCode),
            },
            {
              label: "Net income",
              value: formatMoney(netIncome, org.currencyCode),
              highlight: netIncome !== 0,
            },
          ] as const
        ).map((card) => (
          <div
            key={card.label}
            className="min-w-[9.5rem] shrink-0 snap-start sm:min-w-0"
          >
            <StatCard
              label={card.label}
              value={card.value}
              Icon={"Icon" in card ? card.Icon : undefined}
              compact
              highlight={"highlight" in card ? Boolean(card.highlight) : false}
            />
          </div>
        ))}
      </div>
    </section>
  );
}