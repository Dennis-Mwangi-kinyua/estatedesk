import Link from "next/link";
import type { UnitDetailsViewData } from "../_lib/types";
import { DetailItem, formatCurrency } from "./unit-details-ui";

export function UnitPropertyContextPanel({
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
                Property & building context
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                See how this unit fits into the wider property structure.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                label="Property"
                value={
                  <Link
                    href={`/dashboard/org/properties/${unit.property.id}`}
                    className="text-slate-900 hover:text-slate-700"
                  >
                    {unit.property.name}
                  </Link>
                }
              />
              <DetailItem
                label="Building"
                value={
                  unit.building ? (
                    unit.building.name
                  ) : (
                    <span className="text-slate-500">No building assigned</span>
                  )
                }
              />
              <DetailItem
                label="Location"
                value={unit.property.location || "—"}
              />
              <DetailItem
                label="Address"
                value={unit.property.address || "—"}
              />
              <DetailItem
                label="Water Rate"
                value={
                  unit.property.waterRatePerUnit
                    ? formatCurrency(unit.property.waterRatePerUnit, currencyCode)
                    : "—"
                }
              />
              <DetailItem
                label="Water Fixed Charge"
                value={
                  unit.property.waterFixedCharge
                    ? formatCurrency(unit.property.waterFixedCharge, currencyCode)
                    : "—"
                }
              />
            </div>
          </section>
  );
}
