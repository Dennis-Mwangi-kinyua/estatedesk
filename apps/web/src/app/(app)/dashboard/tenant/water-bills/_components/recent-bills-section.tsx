import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import {
  formatMoney,
  getBillStatusClasses,
} from "@/app/(app)/dashboard/tenant/water-bills/_lib/helpers";
import { ReceiptAction } from "@/app/(app)/dashboard/tenant/water-bills/_components/receipt-action";
import {
  RECENT_BILLS_COUNT,
  type PreparedWaterBill,
} from "@/app/(app)/dashboard/tenant/water-bills/_lib/types";

export function RecentBillsSection({
  preparedBills,
}: {
  preparedBills: PreparedWaterBill[];
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
          Current & Recent Bills
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Card view for quick review of your latest water bills.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {preparedBills.slice(0, RECENT_BILLS_COUNT).map((bill) => (
          <SurfaceCard key={bill.id} className="p-4 sm:p-5">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[20px] font-semibold tracking-tight text-foreground">
                      {bill.period}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getBillStatusClasses(
                        bill.status,
                      )}`}
                    >
                      {bill.statusLabel}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {bill.unitLabel}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Total
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {bill.totalLabel}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="ed-theme-muted-panel rounded-[18px] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Units Used
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {bill.unitsUsed}
                  </p>
                </div>

                <div className="ed-theme-muted-panel rounded-[18px] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Due Date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {bill.dueDateLabel}
                  </p>
                </div>

                <div className="ed-theme-muted-panel rounded-[18px] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Rate Per Unit
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {bill.ratePerUnitLabel}
                  </p>
                </div>

                <div className="ed-theme-muted-panel rounded-[18px] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Outstanding
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {bill.outstandingLabel}
                  </p>
                </div>
              </div>

              {bill.fixedChargeLabel !== formatMoney(0) ? (
                <div className="ed-theme-muted-panel rounded-[18px] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Fixed Charge
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {bill.fixedChargeLabel}
                  </p>
                </div>
              ) : null}

              {bill.notes ? (
                <div className="ed-theme-muted-panel rounded-[18px] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">{bill.notes}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <ReceiptAction href={bill.receiptHref} />
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </section>
  );
}