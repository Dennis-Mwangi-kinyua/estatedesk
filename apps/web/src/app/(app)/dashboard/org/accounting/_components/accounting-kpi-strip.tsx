import {
  Landmark,
  Percent,
  ReceiptText,
  Scale,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
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
      label: "AR open",
      value: formatMoney(arAging.total, org.currencyCode),
      Icon: Users,
    },
    {
      label: "AP open",
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
    <section aria-label="Accounting KPIs">
      {/* True mobile-first grid — no sideways scroll */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {cards.map((card) => (
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
  );
}
