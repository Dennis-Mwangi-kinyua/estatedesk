import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  formatCurrency,
  formatPercent,
} from "@/app/(app)/dashboard/landlord/_lib/helpers";
import { InsightTile } from "@/app/(app)/dashboard/landlord/_components/landlord-ui";
import type { LandlordDashboardData } from "@/app/(app)/dashboard/landlord/_lib/types";

export function PortfolioActionsSection({
  data,
}: {
  data: LandlordDashboardData;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <div className="ios-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Executive view
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-950">
              Portfolio health
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              A concise readout of collection, occupancy, and immediate risk for
              the current period.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${data.healthTone}`}
          >
            {data.portfolioHealth}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InsightTile
            label="Collection gap"
            value={formatCurrency(data.collectionGap)}
            detail={`${formatPercent(data.collectionRate)} collected`}
            tone={data.collectionGap > 0 ? "warn" : "good"}
          />
          <InsightTile
            label="Vacancy exposure"
            value={formatCurrency(data.vacantRent)}
            detail={`${data.vacantUnits} vacant unit${data.vacantUnits === 1 ? "" : "s"}`}
            tone={data.vacantUnits > 0 ? "warn" : "good"}
          />
          <InsightTile
            label="Outstanding tenants"
            value={data.unpaidUnits.length.toLocaleString()}
            detail={`${formatCurrency(data.monthlyBalance)} open balance`}
            tone={data.unpaidUnits.length > 0 ? "bad" : "good"}
          />
        </div>
      </div>

      <div className="ios-panel rounded-[28px] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Priority actions
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-950">
              What needs attention
            </h2>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white">
            <AlertTriangle className="h-5 w-5" />
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {data.atRiskUnits.length > 0 ? (
            data.atRiskUnits.map((unit) => (
              <div
                key={`risk-${unit.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-red-950">
                    {unit.tenantName} · Unit {unit.houseNo}
                  </p>
                  <p className="mt-0.5 text-xs text-red-700">
                    Follow up on current-period balance
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-red-700 ring-1 ring-red-200">
                  {formatCurrency(unit.balance)}
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-emerald-800">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">
                No unpaid tenant balances need attention right now.
              </p>
            </div>
          )}

          {data.vacantUnitQueue.length > 0 ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-3">
              <p className="text-sm font-semibold text-amber-950">
                Vacancy follow-up
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                {data.vacantUnitQueue
                  .map((unit) => `Unit ${unit.houseNo}`)
                  .join(", ")}{" "}
                should be reviewed for listing, viewing, or pricing action.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}