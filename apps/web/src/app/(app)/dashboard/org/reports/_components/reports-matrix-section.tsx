import { Users } from "lucide-react";
import { formatLedgerCurrency } from "@/lib/ledger";
import { formatStatusLabel, statusTone } from "../_lib/helpers";
import type { ReportsPageData } from "../_lib/types";
import { Stars } from "./reports-ui";

export function ReportsMatrixSection({ data }: { data: ReportsPageData }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold text-foreground">Full tenant payment matrix</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Rating is based on current-period behavior: early full payment earns five stars.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-semibold text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {data.filteredRows.length} tenant{data.filteredRows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/15 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              <th className="px-5 py-3 font-semibold sm:px-6">Tenant</th>
              <th className="px-4 py-3 font-semibold">Unit</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Rating</th>
              <th className="px-4 py-3 text-right font-semibold">Expected</th>
              <th className="px-4 py-3 text-right font-semibold">Paid</th>
              <th className="px-5 py-3 text-right font-semibold sm:px-6">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.filteredRows.map((row) => (
              <tr key={row.tenantId} className="transition hover:bg-muted/10">
                <td className="px-5 py-4 sm:px-6">
                  <p className="font-semibold text-foreground">{row.tenantName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {row.phone ?? row.email ?? "No contact added"}
                  </p>
                </td>
                <td className="px-4 py-4 text-muted-foreground">{row.unitLabel}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(row.paymentStatus)}`}
                  >
                    {formatStatusLabel(row.paymentStatus)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1">
                    <Stars score={row.rating.score} />
                    <p className="text-xs text-muted-foreground">{row.rating.label}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-right font-medium text-foreground">
                  {formatLedgerCurrency(row.amountDue)}
                </td>
                <td className="px-4 py-4 text-right font-medium text-foreground">
                  {formatLedgerCurrency(row.amountPaid)}
                </td>
                <td className="px-5 py-4 text-right font-semibold text-foreground sm:px-6">
                  {formatLedgerCurrency(row.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.filteredRows.length === 0 ? (
          <div className="flex flex-col items-center border-t border-border px-5 py-12 text-center sm:px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted/20">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm font-semibold text-foreground">
              No occupants match this report filter
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Try another apartment or payment filter, or confirm tenants and leases are active for
              this reporting period.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}