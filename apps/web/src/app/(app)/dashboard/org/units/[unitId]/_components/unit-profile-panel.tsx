import type { UnitDetailsViewData } from "../_lib/types";
import { DetailItem, formatCurrency, formatDate, formatUnitTypeLabel } from "./unit-details-ui";

export function UnitProfilePanel({
  unit,
  currencyCode,
}: {
  unit: UnitDetailsViewData["unit"];
  currencyCode: string;
}) {
  return (
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-slate-900">
                Unit profile
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Core information, pricing, classification, and generated plan details.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <DetailItem label="Unit Number" value={unit.houseNo} />
              <DetailItem
                label="Unit Type"
                value={formatUnitTypeLabel(unit.type, unit.bedrooms)}
              />
              <DetailItem label="Bedrooms" value={unit.bedrooms ?? "—"} />
              <DetailItem label="Bathrooms" value={unit.bathrooms ?? "—"} />
              <DetailItem
                label="Floor Area"
                value={unit.floorArea ? `${unit.floorArea} sqm` : "—"}
              />
              <DetailItem
                label="Sequence Number"
                value={unit.sequenceNo ?? "—"}
              />
              <DetailItem
                label="Rent Amount"
                value={formatCurrency(unit.rentAmount, currencyCode)}
              />
              <DetailItem
                label="Deposit Amount"
                value={
                  unit.depositAmount
                    ? formatCurrency(unit.depositAmount, currencyCode)
                    : "—"
                }
              />
              <DetailItem
                label="Vacant Since"
                value={formatDate(unit.vacantSince)}
              />
            </div>

            {unit.notes ? (
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Notes
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {unit.notes}
                </p>
              </div>
            ) : null}
          </section>
  );
}
