import { SurfaceCard, StatCard } from "@/components/theme/ed-dashboard-shell";
import {
  BadgeHelp,
  CalendarDays,
  FileText,
  Home,
  Wallet,
} from "lucide-react";
import {
  formatDate,
  formatMoney,
  getChargeStatusClasses,
  getDocumentUrl,
  getLeaseStatusClasses,
} from "../_lib/helpers";
import type { TenantLeaseResult } from "../_lib/types";
import { DetailRow } from "./detail-row";

export function LeaseSection({
  title,
  description,
  leases,
}: {
  title: string;
  description: string;
  leases: TenantLeaseResult["leases"];
}) {
  if (leases.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="px-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-5 lg:space-y-6">
        {leases.map((lease) => {
          const outstandingBalance = lease.rentCharges.reduce(
            (sum, charge) => sum + Number(charge.balance),
            0,
          );
          const contractUrl = getDocumentUrl(lease.contractDocument);

          return (
            <SurfaceCard key={lease.id} className="p-4 sm:p-6 xl:p-7">
              <div className="space-y-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[22px] font-semibold tracking-tight text-foreground">
                        {lease.unit.property.name}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${getLeaseStatusClasses(
                          lease.status,
                        )}`}
                      >
                        {lease.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Unit {lease.unit.houseNo}
                      {lease.unit.building?.name
                        ? ` • ${lease.unit.building.name}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row xl:flex-col xl:items-end">
                    <div className="ed-theme-muted-panel rounded-[22px] px-4 py-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Outstanding
                      </p>
                      <p className="mt-1 text-base font-semibold text-foreground">
                        {formatMoney(outstandingBalance)}
                      </p>
                    </div>

                    {contractUrl ? (
                      <a
                        href={contractUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-black/10 bg-card px-4 py-3 text-sm font-medium text-neutral-800 transition active:scale-[0.98]"
                      >
                        <FileText className="h-4 w-4" />
                        View Contract
                      </a>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-[18px] border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-400">
                        No contract uploaded
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  <StatCard
                    icon={<CalendarDays className="h-4 w-4" />}
                    label="Start"
                    value={formatDate(lease.startDate)}
                  />
                  <StatCard
                    icon={<CalendarDays className="h-4 w-4" />}
                    label="End"
                    value={lease.endDate ? formatDate(lease.endDate) : "Open-ended"}
                  />
                  <StatCard
                    icon={<Wallet className="h-4 w-4" />}
                    label="Rent"
                    value={formatMoney(lease.monthlyRent)}
                  />
                  <StatCard
                    icon={<Home className="h-4 w-4" />}
                    label="Deposit"
                    value={formatMoney(lease.deposit)}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr] 2xl:grid-cols-[0.8fr_1.2fr]">
                  <div className="space-y-4">
                    <div className="ed-theme-muted-panel rounded-[24px] p-4 sm:p-5">
                      <h4 className="text-[17px] font-semibold tracking-tight text-foreground">
                        Lease Details
                      </h4>
                      <dl className="mt-4 space-y-3">
                        <DetailRow label="Property" value={lease.unit.property.name} />
                        <DetailRow
                          label="Building"
                          value={lease.unit.building?.name ?? "N/A"}
                        />
                        <DetailRow label="Unit" value={lease.unit.houseNo} />
                        <DetailRow label="Due Day" value={`Day ${lease.dueDay}`} />
                        <DetailRow
                          label="Deposit"
                          value={formatMoney(lease.deposit)}
                        />
                      </dl>
                    </div>

                    <div className="ed-theme-muted-panel rounded-[24px] p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card">
                          <BadgeHelp className="h-4 w-4 text-neutral-600" />
                        </div>
                        <div>
                          <h4 className="text-[17px] font-semibold tracking-tight text-foreground">
                            Support
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Contact management if your lease details, balance, or
                            contract information needs correction.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ed-theme-muted-panel rounded-[24px] p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-[17px] font-semibold tracking-tight text-foreground">
                        Recent Charges
                      </h4>
                      <span className="text-xs font-medium text-muted-foreground">
                        {lease.rentCharges.length} items
                      </span>
                    </div>

                    {lease.rentCharges.length > 0 ? (
                      <>
                        <div className="mt-4 space-y-3 xl:hidden">
                          {lease.rentCharges.map((charge) => (
                            <div key={charge.id} className="ed-theme-muted-panel rounded-[20px] p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">
                                    {charge.period}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    Due {formatDate(charge.dueDate)}
                                  </p>
                                </div>

                                <span
                                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getChargeStatusClasses(
                                    charge.status,
                                  )}`}
                                >
                                  {charge.status}
                                </span>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="ed-theme-muted-panel rounded-[16px] px-3 py-3">
                                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    Amount Due
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {formatMoney(charge.amountDue)}
                                  </p>
                                </div>

                                <div className="ed-theme-muted-panel rounded-[16px] px-3 py-3">
                                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    Balance
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {formatMoney(charge.balance)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 hidden overflow-hidden ed-theme-muted-panel rounded-[20px] xl:block">
                          <table className="min-w-full text-sm">
                            <thead className="border-b border-border bg-muted/30">
                              <tr className="text-left text-muted-foreground">
                                <th className="px-5 py-4 font-medium">Period</th>
                                <th className="px-5 py-4 font-medium">Due Date</th>
                                <th className="px-5 py-4 font-medium">Amount Due</th>
                                <th className="px-5 py-4 font-medium">Balance</th>
                                <th className="px-5 py-4 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lease.rentCharges.map((charge) => (
                                <tr
                                  key={charge.id}
                                  className="border-b border-neutral-100 last:border-0"
                                >
                                  <td className="px-5 py-4 font-medium text-foreground">
                                    {charge.period}
                                  </td>
                                  <td className="px-5 py-4 text-neutral-600">
                                    {formatDate(charge.dueDate)}
                                  </td>
                                  <td className="px-5 py-4 text-neutral-600">
                                    {formatMoney(charge.amountDue)}
                                  </td>
                                  <td className="px-5 py-4 text-neutral-600">
                                    {formatMoney(charge.balance)}
                                  </td>
                                  <td className="px-5 py-4">
                                    <span
                                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getChargeStatusClasses(
                                        charge.status,
                                      )}`}
                                    >
                                      {charge.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="mt-4 ed-theme-muted-panel rounded-[20px] p-4 text-sm text-muted-foreground">
                        No recent rent charges found for this lease.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SurfaceCard>
          );
        })}
      </div>
    </section>
  );
}
