import { formatCurrency } from "../_lib/helpers";
import type { LeaseDetailsData } from "../_lib/types";

export function LeaseDetailsStats({
  lease,
  currencyCode,
}: {
  lease: LeaseDetailsData["lease"];
  currencyCode: string;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border bg-background p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Monthly Rent</p>
        <p className="mt-2 text-2xl font-semibold">
          {formatCurrency(lease.monthlyRent, currencyCode)}
        </p>
      </div>

      <div className="rounded-xl border bg-background p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Deposit</p>
        <p className="mt-2 text-2xl font-semibold">
          {formatCurrency(lease.deposit, currencyCode)}
        </p>
      </div>

      <div className="rounded-xl border bg-background p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Due Day</p>
        <p className="mt-2 text-2xl font-semibold">{lease.dueDay}</p>
      </div>

      <div className="rounded-xl border bg-background p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Contract</p>
        <p className="mt-2 text-2xl font-semibold">
          {lease.contractDocument ? "Uploaded" : "Missing"}
        </p>
      </div>
    </section>
  );
}