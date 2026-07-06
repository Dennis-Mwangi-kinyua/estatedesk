import { FileSpreadsheet, Scale } from "lucide-react";
import { formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { panelShellClassName, SectionHeader, StatCard } from "./accounting-ui";

export function AccountingReportsWorkspace({ data }: { data: AccountingPageData }) {
  const { org, summary, settings } = data;

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-5">
      <section className={panelShellClassName}>
        <SectionHeader
          icon={FileSpreadsheet}
          title="Financial statements"
          description={`Native GL reports for ${org.name}. Recognition mode: ${settings.recognitionMode}.`}
        />

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
          <StatCard
            label="YTD income"
            value={formatMoney(summary.profitAndLoss.totalIncome, org.currencyCode)}
            highlight
          />
          <StatCard
            label="YTD expenses"
            value={formatMoney(summary.profitAndLoss.totalExpenses, org.currencyCode)}
          />
          <StatCard
            label="Net income"
            value={formatMoney(summary.profitAndLoss.netIncome, org.currencyCode)}
          />
          <StatCard
            label="Cash total"
            value={formatMoney(summary.cashTotal, org.currencyCode)}
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
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

          <div className="grid gap-5 px-5 py-5 sm:px-6 md:grid-cols-3">
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
                      <span className="text-muted-foreground">
                        {row.code} {row.name}
                      </span>
                      <span className="font-medium text-foreground">
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

          <div className="grid gap-5 px-5 py-5 sm:px-6 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Income
              </h3>
              <ul className="mt-3 space-y-2">
                {summary.profitAndLoss.income.map((row) => (
                  <li key={row.code} className="flex items-center justify-between gap-3 text-sm">
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
                  <li key={row.code} className="flex items-center justify-between gap-3 text-sm">
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
        </section>
      </div>
    </div>
  );
}