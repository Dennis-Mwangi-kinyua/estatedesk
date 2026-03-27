import { PropertiesGrid } from "@/features/properties/components/properties-grid";
import { getProperties } from "@/features/properties/queries/get-properties";

function formatCurrency(value: number) {
  return `KES ${value.toLocaleString()}`;
}

export default async function PropertiesPage() {
  const properties = await getProperties();

  const totalProperties = properties.length;
  const totalOccupiedUnits = properties.reduce(
    (sum, property) => sum + property.occupiedUnits,
    0
  );
  const totalVacantUnits = properties.reduce(
    (sum, property) => sum + property.vacantUnits,
    0
  );
  const totalMonthlyRent = properties.reduce(
    (sum, property) => sum + property.monthlyRentTotal,
    0
  );

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Portfolio Overview
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Properties
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">
              Monitor occupancy, rent potential, and tenant distribution across
              all properties in one clean view.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-gray-500">Total Properties</p>
              <p className="mt-1 text-2xl font-bold">{totalProperties}</p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">Occupied Units</p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">
                {totalOccupiedUnits}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs text-amber-700">Vacant Units</p>
              <p className="mt-1 text-2xl font-bold text-amber-800">
                {totalVacantUnits}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-gray-500">Rent Potential</p>
              <p className="mt-1 text-2xl font-bold">
                {formatCurrency(totalMonthlyRent)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <PropertiesGrid properties={properties} />
    </div>
  );
}