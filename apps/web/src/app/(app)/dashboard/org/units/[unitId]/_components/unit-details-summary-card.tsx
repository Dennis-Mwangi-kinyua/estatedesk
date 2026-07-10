import type { UnitDetailsViewData } from "../_lib/types";
import { StatCard, formatCurrency, formatEnumLabel, formatUnitTypeLabel, statusClasses } from "./unit-details-ui";

export function UnitDetailsSummaryCard({
  unit,
  currencyCode,
  totalOpenIssues,
}: {
  unit: UnitDetailsViewData["unit"];
  currencyCode: string;
  totalOpenIssues: number;
}) {
  return (
      <section className="rounded-[30px] border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                  {formatUnitTypeLabel(unit.type, unit.bedrooms)}
                </h2>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                    unit.status,
                  )}`}
                >
                  {formatEnumLabel(unit.status)}
                </span>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    unit.isActive
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                  }`}
                >
                  {unit.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {unit.property.name}
                {unit.building ? ` • ${unit.building.name}` : ""}
                {unit.property.location ? ` • ${unit.property.location}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Monthly rent
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatCurrency(unit.rentAmount, currencyCode)}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Deposit
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {unit.depositAmount
                    ? formatCurrency(unit.depositAmount, currencyCode)
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-6">
          <StatCard
            title="Lease Records"
            value={unit._count.leases}
            subtitle="Historical and current"
          />
          <StatCard
            title="Open Issues"
            value={totalOpenIssues}
            subtitle="Open or in progress"
          />
          <StatCard
            title="Water Bills"
            value={unit._count.waterBills}
            subtitle="Issued for this unit"
          />
          <StatCard
            title="Meter Readings"
            value={unit._count.meterReadings}
            subtitle="Captured over time"
          />
        </div>
      </section>
  );
}
