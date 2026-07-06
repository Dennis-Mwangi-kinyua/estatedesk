import {
  formatCurrency,
  paymentStatusTone,
  unitStatusTone,
} from "@/app/(app)/dashboard/landlord/_lib/helpers";
import { PropertyMiniStat } from "@/app/(app)/dashboard/landlord/_components/landlord-ui";
import type { LandlordDashboardData } from "@/app/(app)/dashboard/landlord/_lib/types";

export function PropertiesSection({
  data,
}: {
  data: LandlordDashboardData;
}) {
  return (
    <section id="properties" className="space-y-4">
      {data.properties.length === 0 ? (
        <div className="ios-card rounded-[28px] p-8 text-center text-sm text-neutral-500">
          No properties have been linked to this landlord account yet.
        </div>
      ) : (
        data.properties.map((property) => (
          <article key={property.id} className="ios-card rounded-[28px] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950">
                  {property.name}
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {[property.location, property.address]
                    .filter(Boolean)
                    .join(" - ") || "No location added"}
                </p>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                {property.units.length} unit
                {property.units.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-4 rounded-[24px] border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Tenants in this property
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {property.units.some((unit) => unit.tenantName) ? (
                      property.units
                        .filter((unit) => unit.tenantName)
                        .map((unit) => (
                          <span
                            key={`${property.id}-${unit.id}-tenant`}
                            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200"
                          >
                            {unit.tenantName} · Unit {unit.houseNo}
                          </span>
                        ))
                    ) : (
                      <span className="text-sm text-neutral-500">
                        No active tenants linked yet.
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[260px]">
                  <PropertyMiniStat
                    label="Units"
                    value={property.units.length.toLocaleString()}
                  />
                  <PropertyMiniStat
                    label="Occupied"
                    value={property.units
                      .filter((unit) => unit.status === "OCCUPIED")
                      .length.toLocaleString()}
                  />
                  <PropertyMiniStat
                    label="Rent"
                    value={formatCurrency(
                      property.units.reduce(
                        (total, unit) => total + Number(unit.rentAmount ?? 0),
                        0,
                      ),
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {property.units.map((unit) => (
                <div
                  key={unit.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">
                        Unit {unit.houseNo}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {unit.tenantName ?? "Vacant"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${unitStatusTone(
                        unit.status,
                      )}`}
                    >
                      {unit.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-neutral-950">
                    {formatCurrency(unit.rentAmount)}
                  </p>
                  {unit.tenantName ? (
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-3 py-2 ring-1 ring-neutral-200">
                      <div>
                        <p className="text-[11px] font-medium text-neutral-500">
                          {data.currentPeriod} balance
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-neutral-950">
                          {formatCurrency(unit.balance)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${paymentStatusTone(
                          unit.paymentStatus,
                        )}`}
                      >
                        {Number(unit.balance ?? 0) <= 0
                          ? "PAID"
                          : unit.paymentStatus}
                      </span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        ))
      )}
    </section>
  );
}