import { Building2, Download, FileText, MapPin } from "lucide-react";
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

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 2xl:grid-cols-3">
        {leases.map((lease) => {
          const hasPdf =
            lease.contractDocument &&
            isPdfLeaseAsset(lease.contractDocument);

          return (
            <article
              key={lease.id}
              className="min-w-0 rounded-2xl border border-border bg-muted/10 p-4 transition hover:border-primary/25 hover:bg-muted/15 sm:p-5"
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 aria-hidden="true" className="size-5" /></span>
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-foreground [overflow-wrap:anywhere]">
                      {lease.unit.property.name}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                      <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                      <span className="break-words [overflow-wrap:anywhere]">{lease.unit.building?.name ? `${lease.unit.building.name} · ` : ""}Unit {lease.unit.houseNo}</span>
                    </p>
                  </div>
                </div>
                <LeaseStatusPill status={lease.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="min-w-0 rounded-xl border border-border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Monthly rent</p>
                  <p className="mt-1 font-semibold">
                    {formatMoney(lease.monthlyRent)}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-border bg-background p-3">
                  <p className="text-xs text-muted-foreground">Lease period</p>
                  <p className="mt-1 break-words font-semibold">
                    {formatDate(lease.startDate)}<br />{lease.endDate ? `to ${formatDate(lease.endDate)}` : "Open-ended"}
                  </p>
                </div>
              </div>
              {hasPdf ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a data-workspace-action="true"
                    href={tenantLeaseDownloadPath(lease.id)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                  <a data-workspace-action="true"
                    href={tenantLeaseDownloadPath(lease.id, { view: true })}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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

    </section>
  );
}
