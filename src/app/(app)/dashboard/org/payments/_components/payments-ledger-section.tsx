import { DeferredLink } from "@/components/navigation/app-links";
import { formatLedgerCurrency, formatLedgerDate } from "@/lib/ledger";
import type { PaymentsPageData } from "../_lib/types";
import { formatStatus, panelShellClassName, statusClasses } from "./payments-ui";

export function PaymentsLedgerSection({
  ledger,
}: {
  ledger: PaymentsPageData["ledger"];
}) {
  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Tenant payment ledger
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Expected rent, paid amounts, deficits, and overdue status for the current
          billing period.
        </p>
      </div>

      {ledger.rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground sm:px-6">
          No tenant balances found for this month.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/20 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Tenant
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Unit
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Due
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Paid
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Deficit
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Oldest due
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Last payment
                </th>
              </tr>
            </thead>
            <tbody>
              {ledger.rows.map((row) => (
                <tr
                  key={row.tenantId}
                  className="border-b border-border/70 transition hover:bg-muted/10"
                >
                  <td className="px-4 py-3">
                    <DeferredLink
                      href={`/dashboard/org/tenants/${row.tenantId}`}
                      className="font-semibold text-foreground transition hover:text-primary"
                    >
                      {row.tenantName}
                    </DeferredLink>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.phone || row.email || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.unitLabel}</td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatLedgerCurrency(row.amountDue)}
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-700 dark:text-emerald-300">
                    {formatLedgerCurrency(row.amountPaid)}
                  </td>
                  <td className="px-4 py-3 font-medium text-red-700 dark:text-red-300">
                    {formatLedgerCurrency(row.deficit)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
                        row.tone,
                      )}`}
                    >
                      {row.paymentStatus}
                    </span>
                    {row.daysPastDue > 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.daysPastDue} days overdue
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatLedgerDate(row.oldestDueDate)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatLedgerDate(row.lastPaymentAt)}
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