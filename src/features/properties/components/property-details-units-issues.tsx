import Link from "next/link";
import type { PropertyDetails } from "@/features/properties/queries/get-property-details";
import { getOrgUnitHref } from "@/lib/units/url";
import {
  formatCurrency,
  formatDate,
  issuePriorityClasses,
  unitStatusClasses,
} from "./property-details-helpers";

export function PropertyDetailsUnitsIssues({
  property,
}: {
  property: PropertyDetails;
}) {
  return (
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
                    href={getOrgUnitHref({
                      id: unit.id,
                      houseNo: unit.houseNo,
                      propertyName: property.name,
                    })}
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
  );
}