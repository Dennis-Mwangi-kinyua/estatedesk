import type { UnitDetailsViewData } from "../_lib/types";
import { DetailItem, formatCurrency, formatDateTime, formatEnumLabel, formatUnitTypeLabel } from "./unit-details-ui";

export function UnitDetailsSidebar({
  unit,
  currencyCode,
  currentLease,
  latestWaterBill,
  latestMeterReading,
}: {
  unit: UnitDetailsViewData["unit"];
  currencyCode: string;
  currentLease: UnitDetailsViewData["unit"]["leases"][number] | null;
  latestWaterBill: UnitDetailsViewData["unit"]["waterBills"][number] | null;
  latestMeterReading: UnitDetailsViewData["unit"]["meterReadings"][number] | null;
}) {
  return (
        <aside className="space-y-8">
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Current snapshot
            </h3>
            <div className="mt-4 space-y-3">
              <DetailItem
                label="Current Lease"
                value={
                  currentLease ? (
                    `${currentLease.tenant.fullName} (${formatEnumLabel(
                      currentLease.status,
                    )})`
                  ) : (
                    "No current lease"
                  )
                }
              />
              <DetailItem
                label="Latest Water Bill"
                value={
                  latestWaterBill
                    ? `${latestWaterBill.period} • ${formatCurrency(
                        latestWaterBill.total,
                        currencyCode,
                      )}`
                    : "No recent bill"
                }
              />
              <DetailItem
                label="Latest Meter Reading"
                value={
                  latestMeterReading
                    ? `${latestMeterReading.period} • ${latestMeterReading.unitsUsed} units`
                    : "No recent reading"
                }
              />
              <DetailItem
                label="Updated"
                value={formatDateTime(unit.updatedAt)}
              />
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Generation source
            </h3>

            {unit.sourcePlan ? (
              <div className="mt-4 space-y-3">
                <DetailItem
                  label="Plan Label"
                  value={unit.sourcePlan.label || "—"}
                />
                <DetailItem
                  label="Plan Type"
                  value={formatUnitTypeLabel(
                    unit.sourcePlan.unitType,
                    unit.sourcePlan.bedrooms,
                  )}
                />
                <DetailItem
                  label="Quantity in Plan"
                  value={unit.sourcePlan.quantity}
                />
                <DetailItem
                  label="House Prefix"
                  value={unit.sourcePlan.houseNoPrefix || "—"}
                />
                <DetailItem
                  label="Start Number"
                  value={unit.sourcePlan.startNumber}
                />
                <DetailItem
                  label="Default Rent"
                  value={formatCurrency(
                    unit.sourcePlan.defaultRentAmount,
                    currencyCode,
                  )}
                />
                <DetailItem
                  label="Default Deposit"
                  value={
                    unit.sourcePlan.defaultDepositAmount
                      ? formatCurrency(
                          unit.sourcePlan.defaultDepositAmount,
                          currencyCode,
                        )
                      : "—"
                  }
                />

                {unit.sourcePlan.notes ? (
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Plan Notes
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {unit.sourcePlan.notes}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                This unit was not linked to a stored property unit plan.
              </div>
            )}
          </section>
        </aside>
  );
}
