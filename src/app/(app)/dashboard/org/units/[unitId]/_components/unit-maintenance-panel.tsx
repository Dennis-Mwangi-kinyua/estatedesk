import type { UnitDetailsViewData } from "../_lib/types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatEnumLabel,
  statusClasses,
} from "./unit-details-ui";

export function UnitMaintenancePanel({
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
                Maintenance & utility activity
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Recent issues, water bills, and meter readings for this unit.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Recent issues</h4>
                {unit.issues.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">No issues recorded.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {unit.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                              issue.status,
                            )}`}
                          >
                            {formatEnumLabel(issue.status)}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {formatEnumLabel(issue.priority)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {issue.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(issue.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900">Recent water bills</h4>
                {unit.waterBills.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">No water bills recorded.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {unit.waterBills.map((bill) => (
                      <div
                        key={bill.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                              bill.status,
                            )}`}
                          >
                            {formatEnumLabel(bill.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {bill.period}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatCurrency(bill.total, currencyCode)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Due {formatDate(bill.dueDate)}
                          {bill.tenant?.fullName ? ` • ${bill.tenant.fullName}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Recent meter readings
                </h4>
                {unit.meterReadings.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    No meter readings recorded.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {unit.meterReadings.map((reading) => (
                      <div
                        key={reading.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                              reading.status,
                            )}`}
                          >
                            {formatEnumLabel(reading.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                          {reading.period}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {reading.prevReading} → {reading.currentReading}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Units used: {reading.unitsUsed}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
  );
}
