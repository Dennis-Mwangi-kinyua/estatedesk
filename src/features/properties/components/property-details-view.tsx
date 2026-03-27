import Link from "next/link";
import type { PropertyDetails } from "@/features/properties/queries/get-property-details";

function formatCurrency(value: number) {
  return `KES ${value.toLocaleString()}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

function statusBadgeClasses(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

function unitStatusClasses(status: string) {
  switch (status) {
    case "OCCUPIED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "VACANT":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "RESERVED":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "UNDER_MAINTENANCE":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

function issuePriorityClasses(priority: string) {
  switch (priority) {
    case "URGENT":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    case "HIGH":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-200";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

function occupancyRate(occupied: number, total: number) {
  if (!total) return 0;
  return Math.round((occupied / total) * 100);
}

export function PropertyDetailsView({
  property,
}: {
  property: PropertyDetails;
}) {
  const occupancy = occupancyRate(
    property.stats.occupiedUnits,
    property.stats.totalUnits
  );

  return (
    <div className="space-y-8">
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

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Units</h2>
              <p className="text-sm text-gray-500">
                Rent, occupancy, and active tenant snapshot
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {property.units.length} units
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {property.units.length ? (
              property.units.map((unit) => (
                <div
                  key={unit.id}
                  className="rounded-2xl border p-4 transition hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">Unit {unit.houseNo}</p>
                      <p className="text-sm text-gray-500">
                        {unit.type.replaceAll("_", " ")}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${unitStatusClasses(
                        unit.status
                      )}`}
                    >
                      {unit.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-gray-500">Rent</p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(unit.rentAmount)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-gray-500">Tenant</p>
                      <p className="mt-1 font-semibold">
                        {unit.tenantName ?? "Vacant"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/units/${unit.id}`}
                      className="text-sm font-medium text-gray-500 transition hover:text-black"
                    >
                      View unit →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-gray-500 md:col-span-2">
                No units found for this property.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Open Issues</h2>
              <p className="text-sm text-gray-500">
                Recent unresolved maintenance tickets
              </p>
            </div>

            <Link
              href={`/issues?propertyId=${property.id}`}
              className="text-sm font-medium text-gray-500 transition hover:text-black"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {property.issues.length ? (
              property.issues.map((issue) => (
                <div key={issue.id} className="rounded-2xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{issue.title}</p>
                      <p className="mt-1 text-sm text-gray-500">
                        {[
                          issue.unitLabel ? `Unit ${issue.unitLabel}` : null,
                          formatDate(issue.createdAt),
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${issuePriorityClasses(
                        issue.priority
                      )}`}
                    >
                      {issue.priority}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {issue.status.replaceAll("_", " ")}
                    </span>

                    <Link
                      href={`/issues/${issue.id}`}
                      className="text-sm font-medium text-gray-500 transition hover:text-black"
                    >
                      Open →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-gray-500">
                No open issues for this property.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}