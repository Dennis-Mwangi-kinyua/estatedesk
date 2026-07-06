import type { UnitDetailsViewData } from "../_lib/types";
import { DetailItem, formatCurrency, formatDate, formatEnumLabel, statusClasses } from "./unit-details-ui";

export function UnitLeasingPanel({
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
                Leasing overview
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Current and recent lease records linked to this unit.
              </p>
            </div>

            {unit.leases.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center">
                <p className="text-sm font-medium text-slate-900">
                  No lease records found
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  This unit has not been linked to a lease yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {unit.leases.map((lease) => (
                  <div
                    key={lease.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900">
                            {lease.tenant.fullName}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusClasses(
                              lease.status,
                            )}`}
                          >
                            {formatEnumLabel(lease.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {lease.tenant.phone || "No phone"}{" "}
                          {lease.tenant.email ? `• ${lease.tenant.email}` : ""}
                        </p>
                      </div>

                      <div className="text-sm text-slate-500">
                        Start: {formatDate(lease.startDate)}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <DetailItem
                        label="Monthly Rent"
                        value={formatCurrency(lease.monthlyRent, currencyCode)}
                      />
                      <DetailItem
                        label="Deposit"
                        value={
                          lease.deposit
                            ? formatCurrency(lease.deposit, currencyCode)
                            : "—"
                        }
                      />
                      <DetailItem
                        label="Due Day"
                        value={lease.dueDay}
                      />
                      <DetailItem
                        label="Lease End"
                        value={formatDate(lease.endDate)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
  );
}
