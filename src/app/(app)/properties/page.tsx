import Link from "next/link";
import { Plus } from "lucide-react";
import { PropertiesGrid } from "@/features/properties/components/properties-grid";
import { getProperties } from "@/features/properties/queries/get-properties";

function formatCurrency(value: number) {
  return `KES ${value.toLocaleString()}`;
}

function formatPropertyType(value: string | null | undefined) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPropertyStatus(isActive: boolean | null | undefined) {
  return isActive ? "Active" : "Inactive";
}

export default async function PropertiesPage() {
  const properties = await getProperties();

  const totalProperties = properties.length;
  const totalOccupiedUnits = properties.reduce(
    (sum, property) => sum + property.occupiedUnits,
    0,
  );
  const totalVacantUnits = properties.reduce(
    (sum, property) => sum + property.vacantUnits,
    0,
  );
  const totalMonthlyRent = properties.reduce(
    (sum, property) => sum + property.monthlyRentTotal,
    0,
  );

  const propertyCards = properties.map((property) => ({
    id: property.id,
    name: property.name,
    location: property.location,
    address: property.address,
    occupiedUnits: property.occupiedUnits,
    vacantUnits: property.vacantUnits,
    monthlyRentTotal: property.monthlyRentTotal,
    totalUnits: property.totalUnits,

    // required by PropertiesGrid
    type: formatPropertyType((property as { type?: string }).type),
    status: formatPropertyStatus((property as { isActive?: boolean }).isActive),
    unitCount: property.totalUnits,
    activeTenants: property.occupiedUnits,
  }));

  return (
    <div className="space-y-5 px-0 pb-6 sm:space-y-6 lg:space-y-8">
      <section className="rounded-[24px] border bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-6">
        <div className="flex flex-col gap-4 lg:gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-500 sm:text-sm sm:normal-case sm:tracking-normal">
              Portfolio Overview
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              Properties
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Monitor occupancy, rent potential, and tenant distribution across
              all properties in one clean view.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end xl:w-auto">
            <Link
              href="/dashboard/org/properties/new"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Create New Property
            </Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-gray-500">Total Properties</p>
            <p className="mt-1 text-2xl font-bold text-gray-950">
              {totalProperties}
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-medium text-emerald-700">Occupied Units</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800">
              {totalOccupiedUnits}
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 p-4">
            <p className="text-xs font-medium text-amber-700">Vacant Units</p>
            <p className="mt-1 text-2xl font-bold text-amber-800">
              {totalVacantUnits}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-gray-500">Rent Potential</p>
            <p className="mt-1 text-2xl font-bold text-gray-950 break-words">
              {formatCurrency(totalMonthlyRent)}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-950">
              All Properties
            </h2>
            <p className="text-sm text-gray-500">
              View and manage your organization’s property portfolio.
            </p>
          </div>
        </div>

        <PropertiesGrid properties={propertyCards} />
      </section>
    </div>
  );
}