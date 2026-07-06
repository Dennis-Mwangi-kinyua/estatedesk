import { formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { panelShellClassName } from "./accounting-ui";

const TYPE_ORDER = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"] as const;

export function AccountingChartOfAccounts({ data }: { data: AccountingPageData }) {
  const { org, summary } = data;

  if (!summary || summary.rows.length === 0) {
    return null;
  }

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    rows: summary.rows.filter((row) => row.type === type),
  })).filter((group) => group.rows.length > 0);

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Chart of accounts
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Active ledger accounts with year-to-date balances grouped by account type.
        </p>
      </div>

      <div className="divide-y divide-border">
        {grouped.map((group) => (
          <div key={group.type} className="px-5 py-4 sm:px-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {group.type}
            </h3>
            <div className="mt-3 space-y-2">
              {group.rows.map((row) => (
                <div
                  key={row.code}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/10 px-4 py-3 text-sm"
                >
                  <span className="font-medium text-foreground">
                    {row.code} · {row.name}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(row.balance, org.currencyCode)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}