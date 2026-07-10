import { BarChart3 } from "lucide-react";
import { InAppGuideHint } from "@/components/help/in-app-guide-hint";
import {
  formatCurrency,
  formatPercent,
} from "@/app/(app)/dashboard/landlord/_lib/helpers";
import type { LandlordDashboardData } from "@/app/(app)/dashboard/landlord/_lib/types";

export function OverviewSection({
  data,
}: {
  data: LandlordDashboardData;
}) {
  return (
    <section id="overview" className="ios-panel rounded-[28px] p-4 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Landlord workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
            {data.displayName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Monitor only the properties and units mapped to your landlord
            account, including occupancy, tenants, expected rent, received rent,
            and open balances for the current period.
          </p>
          <InAppGuideHint topic="rent" workspace="landlord" orgRole="LANDLORD" />
        </div>

        <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-neutral-500">
                Collection rate
              </p>
              <p className="mt-1 text-3xl font-bold text-neutral-950">
                {formatPercent(data.collectionRate)}
              </p>
            </div>
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white">
              <BarChart3 className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white ring-1 ring-neutral-200">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.min(data.collectionRate, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {formatCurrency(data.monthlyAmountPaid)} received from{" "}
            {formatCurrency(data.monthlyAmountDue)} expected.
          </p>
        </div>
      </div>
    </section>
  );
}