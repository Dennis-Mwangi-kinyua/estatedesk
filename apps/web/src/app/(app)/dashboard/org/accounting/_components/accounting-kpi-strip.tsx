import { Percent, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { Landmark, ReceiptText, UsersRound as Users, Wallet } from "@/components/shared/colored-icons";
import { formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { StatCard } from "./accounting-ui";

export function AccountingKpiStrip({ data }: { data: AccountingPageData }) {
  const { org, summary, booksHealth, arAging, apAging } = data;
  if (!summary) return null;

  const cards = [
    {
      label: "YTD income",
      value: formatMoney(summary.income, org.currencyCode),
      Icon: TrendingUp,
      highlight: true,
    },
    {
      label: "YTD expenses",
      value: formatMoney(summary.expenses, org.currencyCode),
      Icon: ReceiptText,
    },
    {
      label: "Net income",
      value: formatMoney(summary.netIncome, org.currencyCode),
      Icon: Scale,
      highlight: summary.netIncome !== 0,
    },
    {
      label: "Cash & bank",
      value: formatMoney(summary.cashTotal, org.currencyCode),
      Icon: Wallet,
    },
    {
      label: "Receivables open",
      value: formatMoney(arAging.total, org.currencyCode),
      Icon: Users,
    },
    {
      label: "Payables open",
      value: formatMoney(apAging.total, org.currencyCode),
      Icon: Landmark,
    },
    {
      label: "Expense ratio",
      value: `${booksHealth.expenseRatioPct}%`,
      Icon: Percent,
    },
    {
      label: "Net margin",
      value: `${booksHealth.netMarginPct}%`,
      Icon: summary.netIncome >= 0 ? TrendingUp : TrendingDown,
    },
  ] as const;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section aria-labelledby="accounting-financial-overview">
        <div className="mb-2.5 flex flex-col gap-0.5 px-0.5 sm:mb-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="accounting-financial-overview" className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            Financial overview
          </h2>
          <p className="text-xs leading-5 text-muted-foreground">Year-to-date results and available funds</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {cards.slice(0, 4).map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              Icon={card.Icon}
              compact
              highlight={"highlight" in card ? Boolean(card.highlight) : false}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="accounting-collections-overview">
        <div className="mb-2.5 flex flex-col gap-0.5 px-0.5 sm:mb-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="accounting-collections-overview" className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            Collections and performance
          </h2>
          <p className="text-xs leading-5 text-muted-foreground">Open balances and operating ratios</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {cards.slice(4).map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              Icon={card.Icon}
              compact
              highlight={"highlight" in card ? Boolean(card.highlight) : false}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
