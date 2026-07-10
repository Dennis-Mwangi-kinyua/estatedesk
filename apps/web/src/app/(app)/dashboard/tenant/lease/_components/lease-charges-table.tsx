import {
  formatDate,
  formatMoney,
  getChargeStatusClasses,
} from "../_lib/helpers";
import type { TenantLeaseResult } from "../_lib/types";

type LeaseCharge = TenantLeaseResult["leases"][number]["rentCharges"][number];

export function LeaseChargesTable({ charges }: { charges: LeaseCharge[] }) {
  if (charges.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
        No recent rent charges found for this lease.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {charges.map((charge) => (
          <div
            key={charge.id}
            className="rounded-2xl border border-border bg-muted/10 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {charge.period}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Due {formatDate(charge.dueDate)}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getChargeStatusClasses(
                  charge.status,
                )}`}
              >
                {charge.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-background px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Amount due
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatMoney(charge.amountDue)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Balance
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatMoney(charge.balance)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border lg:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/20">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
                Period
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
                Due date
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
                Amount due
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
                Balance
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {charges.map((charge) => (
              <tr
                key={charge.id}
                className="border-b border-border/70 last:border-0"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {charge.period}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(charge.dueDate)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatMoney(charge.amountDue)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatMoney(charge.balance)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getChargeStatusClasses(
                      charge.status,
                    )}`}
                  >
                    {charge.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}