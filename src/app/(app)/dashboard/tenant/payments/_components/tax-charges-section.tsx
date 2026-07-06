import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import {
  formatDate,
  formatMoney,
} from "@/app/(app)/dashboard/tenant/payments/_lib/helpers";
import type { TenantTaxChargeItem } from "@/app/(app)/dashboard/tenant/payments/_lib/types";

function getTaxStatusClasses(status: string) {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "OVERDUE":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "PARTIALLY_PAID":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
  }
}

export function TaxChargesSection({
  taxCharges,
}: {
  taxCharges: TenantTaxChargeItem[];
}) {
  if (taxCharges.length === 0) {
    return null;
  }

  return (
    <SurfaceCard className="p-4 sm:p-6 xl:p-7">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
          Tax charges
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Statutory tax assessments linked to your tenancy.
        </p>
      </div>

      <div className="mt-5 space-y-3 lg:hidden">
        {taxCharges.map((charge) => (
          <div
            key={charge.id}
            className="rounded-[22px] border border-border bg-muted/20 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {charge.taxType} • {charge.period}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {charge.taxAuthority}
                  {charge.assessmentRef ? ` • ${charge.assessmentRef}` : ""}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getTaxStatusClasses(
                  charge.status,
                )}`}
              >
                {charge.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Due</p>
                <p className="mt-1 font-semibold text-foreground">
                  {formatMoney(charge.amountDue)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Paid</p>
                <p className="mt-1 font-semibold text-foreground">
                  {formatMoney(charge.amountPaid)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Balance</p>
                <p className="mt-1 font-semibold text-foreground">
                  {formatMoney(charge.balance)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Due {formatDate(charge.dueDate)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 hidden overflow-hidden rounded-[24px] border border-border bg-card lg:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr className="text-left text-muted-foreground">
              <th className="px-5 py-4 font-medium">Period</th>
              <th className="px-5 py-4 font-medium">Tax type</th>
              <th className="px-5 py-4 font-medium">Authority</th>
              <th className="px-5 py-4 font-medium">Amount due</th>
              <th className="px-5 py-4 font-medium">Paid</th>
              <th className="px-5 py-4 font-medium">Balance</th>
              <th className="px-5 py-4 font-medium">Due date</th>
              <th className="px-5 py-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {taxCharges.map((charge) => (
              <tr
                key={charge.id}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-5 py-4 font-medium text-foreground">
                  {charge.period}
                </td>
                <td className="px-5 py-4 text-neutral-600">{charge.taxType}</td>
                <td className="px-5 py-4 text-neutral-600">
                  {charge.taxAuthority}
                </td>
                <td className="px-5 py-4 font-semibold text-foreground">
                  {formatMoney(charge.amountDue)}
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  {formatMoney(charge.amountPaid)}
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  {formatMoney(charge.balance)}
                </td>
                <td className="px-5 py-4 text-neutral-600">
                  {formatDate(charge.dueDate)}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getTaxStatusClasses(
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
    </SurfaceCard>
  );
}