import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import type { PreparedWaterBill } from "@/app/(app)/dashboard/tenant/water-bills/_lib/types";

export function WaterBillsHeader({
  latestBill,
}: {
  latestBill: PreparedWaterBill | null;
}) {
  return (
    <SurfaceCard className="p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Water Billing
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
            Water Bills
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            View your water usage, bill totals, due dates, payment status, and
            billing history.
          </p>
        </div>

        {latestBill ? (
          <div className="ed-theme-muted-panel rounded-[24px] px-4 py-4 sm:px-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Latest Bill
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {latestBill.totalLabel}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {latestBill.period} • Due {latestBill.dueDateLabel}
            </p>
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}