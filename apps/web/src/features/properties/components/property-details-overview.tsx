import Link from "next/link";
import type { PropertyDetails } from "@/features/properties/queries/get-property-details";
import {
  formatCurrency,
  formatDate,
  occupancyRate,
  statusBadgeClasses,
} from "./property-details-helpers";

export function PropertyDetailsOverview({
  property,
}: {
  property: PropertyDetails;
}) {
  const occupancy = occupancyRate(
    property.stats.occupiedUnits,
    property.stats.totalUnits
  );

  return (
    <section className="rounded-[28px] border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/properties"
              className="text-sm font-medium text-gray-500 transition hover:text-black"
            >
              ← Back to properties
            </Link>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(
                property.isActive
              )}`}
            >
              {property.isActive ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              Property Overview
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              {property.name}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {[
                property.type.replaceAll("_", " "),
                property.location,
                property.address,
              ]
                .filter(Boolean)
                .join(" • ") || "No location details added"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 xl:justify-end">
          <Link
            href={`/properties/${property.id}/edit`}
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-black"
          >
            Edit Property
          </Link>

          <Link
            href={`/properties/${property.id}/units/new`}
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-black"
          >
            Add Unit
          </Link>

          <Link
            href={`/staff?propertyId=${property.id}`}
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-black"
          >
            Assign Caretaker
          </Link>

          <Link
            href={`/issues/new?propertyId=${property.id}`}
            className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Report Issue
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-gray-500">Total Units</p>
          <p className="mt-1 text-2xl font-bold">
            {property.stats.totalUnits}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-gray-500">Occupancy</p>
          <p className="mt-1 text-2xl font-bold">{occupancy}%</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-gray-500">Buildings</p>
          <p className="mt-1 text-2xl font-bold">
            {property.buildingsCount}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs text-gray-500">Rent Potential</p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(property.stats.monthlyRentPotential)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-gray-500">Water Rate / Unit</p>
          <p className="mt-1 text-lg font-semibold">
            {property.waterRatePerUnit !== null
              ? formatCurrency(property.waterRatePerUnit)
              : "Not set"}
          </p>
        </div>

        <div className="rounded-2xl border p-4">
          <p className="text-xs text-gray-500">Water Fixed Charge</p>
          <p className="mt-1 text-lg font-semibold">
            {property.waterFixedCharge !== null
              ? formatCurrency(property.waterFixedCharge)
              : "Not set"}
          </p>
        </div>

        <div className="rounded-2xl border p-4">
          <p className="text-xs text-gray-500">Created</p>
          <p className="mt-1 text-lg font-semibold">
            {formatDate(property.createdAt)}
          </p>
        </div>
      </div>

      {property.notes ? (
        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Notes
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            {property.notes}
          </p>
        </div>
      ) : null}
    </section>
  );
}