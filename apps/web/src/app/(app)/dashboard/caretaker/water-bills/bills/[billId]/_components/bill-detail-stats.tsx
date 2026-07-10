import { StatCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import {
  formatCurrency,
  formatDate,
} from "@/app/(app)/dashboard/caretaker/water-bills/_lib/helpers";
import type { CaretakerBillDetailPageData } from "../_lib/types";

export function BillDetailStats({
  data,
}: {
  data: Extract<CaretakerBillDetailPageData, { ok: true }>;
}) {
  const { bill } = data;

  return (
    <>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Period" value={bill.period} />
        <StatCard label="Units used" value={bill.unitsUsed} />
        <StatCard
          label="Rate per unit"
          value={formatCurrency(bill.ratePerUnit)}
        />
        <StatCard
          label="Fixed charge"
          value={formatCurrency(bill.fixedCharge)}
        />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total bill" value={formatCurrency(bill.total)} />
        <StatCard label="Total paid" value={data.totalPaid} />
        <StatCard
          label="Balance"
          value={data.balance}
          highlight={data.hasOutstandingBalance ? "warning" : "default"}
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Billing details
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Tenant</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {bill.tenant.fullName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {bill.tenant.phone ?? "—"}
              {bill.tenant.email ? ` · ${bill.tenant.email}` : ""}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Due date</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(bill.dueDate)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Created at</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(bill.createdAt)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Updated at</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(bill.updatedAt)}
            </p>
          </div>
        </div>

        {bill.notes ? (
          <div className="border-t border-border px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm text-foreground">{bill.notes}</p>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}