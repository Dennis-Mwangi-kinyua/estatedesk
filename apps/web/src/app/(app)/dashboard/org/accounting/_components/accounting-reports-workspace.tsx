import { FileSpreadsheet, Scale } from "lucide-react";
import {
  DataCard,
  DataCardRow,
  ResponsiveDataList,
} from "@/components/ui/responsive-data-list";
import { formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { AccountingAgingPanel } from "./accounting-aging-panel";
import { AccountingBooksHealth } from "./accounting-books-health";
import { AccountingKpiStrip } from "./accounting-kpi-strip";
import { AccountingTopExpenses } from "./accounting-top-expenses";
import { panelShellClassName, SectionHeader, StatCard } from "./accounting-ui";

export function AccountingReportsWorkspace({ data }: { data: AccountingPageData }) {
  const { org, summary, settings } = data;

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className={panelShellClassName}>
        <SectionHeader
          icon={FileSpreadsheet}
          title="Financial statements"
          description={`Native GL reports for ${org.name}. Recognition: ${settings.recognitionMode}.`}
        />

        <div className="grid grid-cols-2 gap-2.5 px-4 py-4 sm:grid-cols-2 sm:gap-3 sm:px-6 lg:grid-cols-4">
          <StatCard
            label="YTD income"
            value={formatMoney(summary.profitAndLoss.totalIncome, org.currencyCode)}
            highlight
            compact
          />
          <StatCard
            label="YTD expenses"
            value={formatMoney(summary.profitAndLoss.totalExpenses, org.currencyCode)}
            compact
          />
          <StatCard
            label="Net income"
            value={formatMoney(summary.profitAndLoss.netIncome, org.currencyCode)}
            compact
          />
          <StatCard
            label="Cash total"
            value={formatMoney(summary.cashTotal, org.currencyCode)}
            compact
          />
        </div>
      </section>

      <AccountingKpiStrip data={data} />
      <AccountingBooksHealth data={data} />
      <AccountingAgingPanel
        arAging={data.arAging}
        apAging={data.apAging}
        currencyCode={org.currencyCode}
      />
      <AccountingTopExpenses data={data} />

      <div className="grid gap-4 xl:grid-cols-2 xl:gap-5">
        <section className={panelShellClassName}>
          <SectionHeader
            icon={Scale}
            title="Balance sheet"
            description={
              summary.balanceSheet.balanced
                ? "Assets equal liabilities plus equity."
                : "Review journal entries — the balance sheet is out of balance."
            }
          />

          <div className="space-y-5 px-4 py-4 sm:px-6 md:grid md:grid-cols-3 md:gap-5 md:space-y-0">
            {(["assets", "liabilities", "equity"] as const).map((section) => (
              <div key={section}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {section}
                </h3>
                <ul className="mt-3 space-y-2">
                  {summary.balanceSheet[section].map((row) => (
                    <li
                      key={row.code}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="min-w-0 truncate text-muted-foreground">
                        {row.code} {row.name}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-foreground">
                        {formatMoney(row.balance, org.currencyCode)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 border-t border-border pt-3 text-sm font-semibold text-foreground">
                  Total{" "}
                  {formatMoney(
                    section === "assets"
                      ? summary.balanceSheet.totalAssets
                      : section === "liabilities"
                        ? summary.balanceSheet.totalLiabilities
                        : summary.balanceSheet.totalEquity,
                    org.currencyCode,
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className={panelShellClassName}>
          <SectionHeader
            title="Profit & loss"
            description="Year-to-date income and expense accounts from the general ledger."
          />

          <ResponsiveDataList
            mobile={
              <div className="space-y-1">
                <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Income
                </p>
                <ul className="divide-y divide-border">
                  {summary.profitAndLoss.income.map((row) => (
                    <li key={row.code}>
                      <DataCard>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">
                            {row.code} · {row.name}
                          </p>
                          <p className="shrink-0 text-sm font-semibold tabular-nums">
                            {formatMoney(row.balance, org.currencyCode)}
                          </p>
                        </div>
                        <dl className="mt-2 space-y-1 rounded-xl border border-border bg-muted/20 p-2.5">
                          <DataCardRow label="Type" value="Income" />
                        </dl>
                      </DataCard>
                    </li>
                  ))}
                </ul>
                <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Expenses
                </p>
                <ul className="divide-y divide-border">
                  {summary.profitAndLoss.expenses.map((row) => (
                    <li key={row.code}>
                      <DataCard>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">
                            {row.code} · {row.name}
                          </p>
                          <p className="shrink-0 text-sm font-semibold tabular-nums">
                            {formatMoney(row.balance, org.currencyCode)}
                          </p>
                        </div>
                      </DataCard>
                    </li>
                  ))}
                </ul>
              </div>
            }
            desktop={
              <div className="grid gap-5 px-5 py-5 sm:px-6 md:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Income
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {summary.profitAndLoss.income.map((row) => (
                      <li
                        key={row.code}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {row.code} {row.name}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatMoney(row.balance, org.currencyCode)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Expenses
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {summary.profitAndLoss.expenses.map((row) => (
                      <li
                        key={row.code}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {row.code} {row.name}
                        </span>
                        <span className="font-medium text-foreground">
                          {formatMoney(row.balance, org.currencyCode)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            }
          />
        </section>
      </div>
    </div>
  );
}
