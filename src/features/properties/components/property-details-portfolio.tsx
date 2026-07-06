import type { PropertyDetails } from "@/features/properties/queries/get-property-details";
import { occupancyRate } from "./property-details-helpers";

export function PropertyDetailsPortfolio({
  property,
}: {
  property: PropertyDetails;
}) {
  const occupancy = occupancyRate(
    property.stats.occupiedUnits,
    property.stats.totalUnits
  );

  return (
    <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">Portfolio Health</h2>
          <p className="text-sm text-gray-500">
            Unit distribution and current operational status
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs text-emerald-700">Occupied</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800">
              {property.stats.occupiedUnits}
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-xs text-amber-700">Vacant</p>
            <p className="mt-1 text-2xl font-bold text-amber-800">
              {property.stats.vacantUnits}
            </p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs text-blue-700">Reserved</p>
            <p className="mt-1 text-2xl font-bold text-blue-800">
              {property.stats.reservedUnits}
            </p>
          </div>
          <div className="rounded-2xl bg-rose-50 p-4">
            <p className="text-xs text-rose-700">Maintenance</p>
            <p className="mt-1 text-2xl font-bold text-rose-800">
              {property.stats.maintenanceUnits}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-gray-500">Occupancy Progress</span>
            <span className="font-medium">{occupancy}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-black"
              style={{ width: `${occupancy}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <p className="text-xs text-gray-500">Active Tenants</p>
            <p className="mt-1 text-2xl font-bold">
              {property.stats.activeTenants}
            </p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-xs text-gray-500">Open Issues</p>
            <p className="mt-1 text-2xl font-bold">
              {property.stats.openIssues}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">Caretakers</h2>
          <p className="text-sm text-gray-500">
            Assigned staff responsible for this property
          </p>
        </div>

        <div className="space-y-3">
          {property.caretakers.length ? (
            property.caretakers.map((caretaker) => (
              <div key={caretaker.id} className="rounded-2xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{caretaker.fullName}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {[caretaker.phone, caretaker.email]
                        .filter(Boolean)
                        .join(" • ") || "No contact details"}
                    </p>
                  </div>

                  {caretaker.isPrimary ? (
                    <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                      Primary
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-6 text-sm text-gray-500">
              No active caretaker assignments for this property.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}