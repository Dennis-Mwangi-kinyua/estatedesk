import { Download, FileText } from "lucide-react";
import { formatDate, formatMoney } from "../_lib/helpers";
import { isPdfLeaseAsset, tenantLeaseDownloadPath } from "../_lib/download";
import type { TenantLeaseResult } from "../_lib/types";
import { LeaseStatusPill, panelShellClassName } from "./leases-ui";

type HistoricalLease = TenantLeaseResult["leases"][number];

export function LeaseHistorySection({
  leases,
}: {
  leases: HistoricalLease[];
}) {
  if (leases.length === 0) {
    return null;
  }

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Lease history
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Previous, pending, cancelled, or closed tenancy records.
        </p>
      </div>

      <div className="space-y-3 p-4 sm:hidden">
        {leases.map((lease) => {
          const hasPdf =
            lease.contractDocument &&
            isPdfLeaseAsset(lease.contractDocument);

          return (
            <article
              key={lease.id}
              className="rounded-2xl border border-border bg-muted/10 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {lease.unit.property.name}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Unit {lease.unit.houseNo}
                  </p>
                </div>
                <LeaseStatusPill status={lease.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Rent</p>
                  <p className="mt-1 font-semibold">
                    {formatMoney(lease.monthlyRent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Period</p>
                  <p className="mt-1 font-semibold">
                    {formatDate(lease.startDate)} –{" "}
                    {lease.endDate ? formatDate(lease.endDate) : "Open"}
                  </p>
                </div>
              </div>
              {hasPdf ? (
                <div className="mt-4 flex gap-2">
                  <a
                    href={tenantLeaseDownloadPath(lease.id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                  <a
                    href={tenantLeaseDownloadPath(lease.id, { view: true })}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View
                  </a>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/20">
            <tr className="text-left">
              {[
                "Property",
                "Unit",
                "Monthly rent",
                "Start",
                "End",
                "Status",
                "Contract",
              ].map((label) => (
                <th
                  key={label}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leases.map((lease) => {
              const hasPdf =
                lease.contractDocument &&
                isPdfLeaseAsset(lease.contractDocument);

              return (
                <tr
                  key={lease.id}
                  className="border-b border-border/70 transition hover:bg-muted/10"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {lease.unit.property.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lease.unit.houseNo}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatMoney(lease.monthlyRent)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(lease.startDate)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lease.endDate ? formatDate(lease.endDate) : "Open-ended"}
                  </td>
                  <td className="px-4 py-3">
                    <LeaseStatusPill status={lease.status} />
                  </td>
                  <td className="px-4 py-3">
                    {hasPdf ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={tenantLeaseDownloadPath(lease.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary/80"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </a>
                        <a
                          href={tenantLeaseDownloadPath(lease.id, { view: true })}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}