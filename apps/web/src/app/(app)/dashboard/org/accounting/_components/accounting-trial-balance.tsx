import { formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
import { panelShellClassName } from "./accounting-ui";

export function AccountingTrialBalance({ data }: { data: AccountingPageData }) {
  const { org, summary } = data;

  if (!summary) {
    return null;
  }

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Trial balance
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Account debits, credits, and net balances for the current fiscal year.
        </p>
      </div>

      {summary.rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
          No posted journal lines yet. Post an expense or journal entry to populate the
          trial balance.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/20">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Account
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Debit
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Credit
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((row) => (
                <tr
                  key={row.code}
                  className="border-b border-border/70 transition hover:bg-muted/10"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {row.code} · {row.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatMoney(row.debit, org.currencyCode)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatMoney(row.credit, org.currencyCode)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {formatMoney(row.balance, org.currencyCode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}