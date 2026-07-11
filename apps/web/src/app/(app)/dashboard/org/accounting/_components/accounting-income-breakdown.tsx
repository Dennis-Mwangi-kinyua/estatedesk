import {
  Droplets,
  Home,
  Percent,
  ReceiptText,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { expenseRatio, netMarginPct } from "@/lib/accounting/aging";
import { formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { panelShellClassName } from "./accounting-ui";

function SmartCard({
  label,
  value,
  hint,
  Icon,
  tone = "neutral",
  wide = false,
}: {
  label: string;
  value: string;
  hint?: string;
  Icon?: typeof TrendingUp;
  tone?: "neutral" | "income" | "expense" | "positive" | "negative" | "accent";
  wide?: boolean;
}) {
  const toneStyles = {
    neutral: "border-border/80 bg-card",
    income: "border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/25",
    expense: "border-rose-200/70 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20",
    positive: "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/30",
    negative: "border-rose-200/80 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/30",
    accent: "border-primary/25 bg-primary/[0.06]",
  } as const;

  const iconTone = {
    neutral: "border-border bg-muted/40 text-primary",
    income: "border-emerald-200/80 bg-emerald-100/80 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-200",
    expense: "border-rose-200/80 bg-rose-100/80 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-200",
    positive: "border-emerald-200/80 bg-emerald-100/80 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-200",
    negative: "border-rose-200/80 bg-rose-100/80 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-200",
    accent: "border-primary/20 bg-primary/10 text-primary",
  } as const;

  return (
    <article
      className={[
        "relative overflow-hidden rounded-2xl border p-3.5 shadow-[0_1px_0_rgba(15,23,42,0.03)] sm:p-4",
        toneStyles[tone],
        wide ? "col-span-2" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">
            {label}
          </p>
          <p className="mt-1.5 break-words text-lg font-semibold tabular-nums tracking-tight text-foreground sm:text-xl">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground sm:text-xs sm:leading-5">
              {hint}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <span
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border sm:h-10 sm:w-10 ${iconTone[tone]}`}
          >
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function AccountingIncomeBreakdown({ data }: { data: AccountingPageData }) {
  const { org, summary, booksHealth, settings } = data;

  if (!summary) {
    return null;
  }

  const { controlBalances, income, expenses, netIncome } = summary;
  const otherIncome = Math.max(
    0,
    income - controlBalances.rentIncome - controlBalances.waterIncome,
  );
  const margin = netMarginPct(income, netIncome);
  const ratio = booksHealth?.expenseRatioPct ?? expenseRatio(income, expenses);
  const incomeShare =
    income > 0 ? Math.min(100, Math.round((controlBalances.rentIncome / income) * 100)) : 0;
  const expenseShareOfIncome =
    income > 0 ? Math.min(100, Math.round((expenses / income) * 100)) : expenses > 0 ? 100 : 0;
  const netPositive = netIncome >= 0;

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              Statement
            </p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground sm:text-lg">
              Income statement (YTD)
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
              Fiscal year-to-date performance — rent, utilities, operating spend, and net
              result for {org.name}.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {settings.recognitionMode}
            </span>
            <span className="inline-flex rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {org.currencyCode}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-3 sm:space-y-5 sm:p-5">
        {/* Result summary — always 2-up on phones */}
        <div>
          <p className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Year-to-date result
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <SmartCard
              label="Net income"
              value={formatMoney(netIncome, org.currencyCode)}
              hint={netPositive ? "Surplus YTD" : "Deficit YTD"}
              Icon={netPositive ? TrendingUp : TrendingDown}
              tone={netPositive ? "positive" : "negative"}
            />
            <SmartCard
              label="Net margin"
              value={`${margin}%`}
              hint="Net ÷ total income"
              Icon={Percent}
              tone={netPositive ? "accent" : "negative"}
            />
          </div>
        </div>

        {/* Income stack */}
        <div>
          <p className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Income
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <SmartCard
              label="Rent income"
              value={formatMoney(controlBalances.rentIncome, org.currencyCode)}
              hint={income > 0 ? `${incomeShare}% of total income` : "No income posted"}
              Icon={Home}
              tone="income"
            />
            <SmartCard
              label="Water income"
              value={formatMoney(controlBalances.waterIncome, org.currencyCode)}
              hint="Utility collections"
              Icon={Droplets}
              tone="income"
            />
            {otherIncome > 0.009 ? (
              <SmartCard
                label="Other income"
                value={formatMoney(otherIncome, org.currencyCode)}
                hint="Service & misc revenue"
                Icon={Scale}
                tone="neutral"
              />
            ) : null}
            <SmartCard
              label="Total income"
              value={formatMoney(income, org.currencyCode)}
              hint="All income accounts YTD"
              Icon={TrendingUp}
              tone="accent"
              wide={otherIncome <= 0.009}
            />
          </div>
        </div>

        {/* Expense stack */}
        <div>
          <p className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Expenses
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <SmartCard
              label="Total expenses"
              value={formatMoney(expenses, org.currencyCode)}
              hint="Operating spend YTD"
              Icon={ReceiptText}
              tone="expense"
            />
            <SmartCard
              label="Expense ratio"
              value={`${ratio}%`}
              hint="Expenses ÷ income"
              Icon={Percent}
              tone={ratio > 70 ? "negative" : "neutral"}
            />
          </div>
        </div>

        {/* Composition bar */}
        <div className="rounded-2xl border border-border/80 bg-muted/15 p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-foreground">Income vs expenses</span>
            <span className="tabular-nums text-muted-foreground">
              {formatMoney(income, org.currencyCode)} · {formatMoney(expenses, org.currencyCode)}
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.max(0, 100 - expenseShareOfIncome)}%` }}
              title="Share of income retained before expenses fill"
            />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>
              Retained before expense load ·{" "}
              <span className="font-semibold text-foreground">
                {Math.max(0, 100 - expenseShareOfIncome)}%
              </span>
            </span>
            <span>
              Expense load ·{" "}
              <span className="font-semibold text-foreground">{expenseShareOfIncome}%</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
