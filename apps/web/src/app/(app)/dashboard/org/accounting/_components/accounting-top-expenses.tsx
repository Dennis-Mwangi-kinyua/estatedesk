import { PieChart } from "lucide-react";
import {
  DataCard,
  DataCardRow,
  ResponsiveDataList,
} from "@/components/ui/responsive-data-list";
import { formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { panelShellClassName, SectionHeader } from "./accounting-ui";

export function AccountingTopExpenses({ data }: { data: AccountingPageData }) {
  const { org, topExpenseAccounts, summary } = data;
  if (!summary || topExpenseAccounts.length === 0) return null;

  const max = Math.max(...topExpenseAccounts.map((r) => r.balance), 1);

  return (
    <section className={panelShellClassName}>
      <SectionHeader
        icon={PieChart}
        title="Top expense accounts (YTD)"
        description="Where operating spend is concentrating — useful for budgets and month-end review."
      />

      <ResponsiveDataList
        mobile={
          <ul className="divide-y divide-border">
            {topExpenseAccounts.map((row) => (
              <li key={row.code}>
                <DataCard>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">
                      {row.code} · {row.name}
                    </p>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatMoney(row.balance, org.currencyCode)}
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{ width: `${Math.min(100, (row.balance / max) * 100)}%` }}
                    />
                  </div>
                  <dl className="mt-2.5 space-y-1.5 rounded-xl border border-border bg-muted/20 p-2.5">
                    <DataCardRow
                      label="Share of expenses"
                      value={
                        summary.expenses > 0
                          ? `${Math.round((row.balance / summary.expenses) * 1000) / 10}%`
                          : "—"
                      }
                    />
                  </dl>
                </DataCard>
              </li>
            ))}
          </ul>
        }
        desktop={
          <div className="space-y-3 px-5 py-4 sm:px-6">
            {topExpenseAccounts.map((row) => (
              <div key={row.code} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-foreground">
                      {row.code} · {row.name}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">
                      {formatMoney(row.balance, org.currencyCode)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/80"
                      style={{
                        width: `${Math.min(100, (row.balance / max) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      />
    </section>
  );
}
