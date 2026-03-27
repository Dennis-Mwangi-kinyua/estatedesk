import Link from "next/link";
import type { PropertyCardItem } from "@/features/properties/queries/get-properties";

function formatCurrency(value: number) {
  return `KES ${value.toLocaleString()}`;
}

function getOccupancyRate(occupied: number, total: number) {
  if (!total) return 0;
  return Math.round((occupied / total) * 100);
}

function propertyStatusClasses(status: string) {
  return status === "ACTIVE"
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

export function PropertiesGrid({
  properties,
}: {
  properties: PropertyCardItem[];
}) {
  if (!properties.length) {
    return (
      <div className="rounded-[28px] border border-dashed bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-semibold">No properties yet</h2>
        <p className="mt-2 text-sm text-gray-500">
          Start by adding your first property to manage units, tenants, bills,
          and operations from one place.
        </p>

        <Link
          href="/properties/new"
          className="mt-6 inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          Add Property
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-3">
      {properties.map((property) => {
        const occupancyRate = getOccupancyRate(
          property.occupiedUnits,
          property.unitCount
        );

        return (
          <Link
            key={property.id}
            href={`/properties/${property.id}`}
            className="group rounded-[28px] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-semibold tracking-tight group-hover:underline">
                    {property.name}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${propertyStatusClasses(
                      property.status
                    )}`}
                  >
                    {property.status}
                  </span>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  {property.type.replaceAll("_", " ")}
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-slate-50 px-4 py-3 text-right">
                <p className="text-xs text-gray-500">Occupancy</p>
                <p className="mt-1 text-lg font-bold">{occupancyRate}%</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Location
              </p>
              <p className="mt-2 text-sm text-gray-700">
                {[property.location, property.address].filter(Boolean).join(" • ") ||
                  "No location details added"}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border p-4">
                <p className="text-xs text-gray-500">Units</p>
                <p className="mt-1 text-2xl font-bold">{property.unitCount}</p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="text-xs text-gray-500">Tenants</p>
                <p className="mt-1 text-2xl font-bold">
                  {property.activeTenants}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs text-emerald-700">Occupied</p>
                <p className="mt-1 text-2xl font-bold text-emerald-800">
                  {property.occupiedUnits}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs text-amber-700">Vacant</p>
                <p className="mt-1 text-2xl font-bold text-amber-800">
                  {property.vacantUnits}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Occupancy Progress</span>
                <span className="font-medium">{occupancyRate}%</span>
              </div>

              <div className="h-3 rounded-full bg-slate-100">
                <div
                  className="h-3 rounded-full bg-black transition-all"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4 border-t pt-5">
              <div>
                <p className="text-xs text-gray-500">Monthly Rent Potential</p>
                <p className="mt-1 text-lg font-bold">
                  {formatCurrency(property.monthlyRentTotal)}
                </p>
              </div>

              <span className="text-sm font-semibold text-gray-500 transition group-hover:text-black">
                View details →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}