import Link from "next/link";
import { Download, FileText, MapPin } from "lucide-react";
import { formatDate, formatMoney } from "../_lib/helpers";
import { isPdfLeaseAsset, tenantLeaseDownloadPath } from "../_lib/download";
import type { TenantLeaseResult } from "../_lib/types";
import { LeaseChargesTable } from "./lease-charges-table";
import { LeaseStatusPill, panelShellClassName, SummaryMetric } from "./leases-ui";

type ActiveLease = TenantLeaseResult["leases"][number];

function leaseLocation(lease: ActiveLease) {
  return [
    lease.unit.property.name,
    lease.unit.building?.name ?? null,
    `Unit ${lease.unit.houseNo}`,
  ]
    .filter(Boolean)
    .join(" / ");
}

export function ActiveLeasePanel({ lease }: { lease: ActiveLease }) {
  const outstandingBalance = lease.rentCharges.reduce(
    (sum, charge) => sum + Number(charge.balance),
    0,
  );
  const contractDocument = lease.contractDocument;
  const hasPdfContract =
    Boolean(contractDocument?.key) && isPdfLeaseAsset(contractDocument!);

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Current tenancy
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {lease.unit.property.name}
              </h2>
              <LeaseStatusPill status={lease.status} />
            </div>
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{leaseLocation(lease)}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:items-end">
            {hasPdfContract ? (
              <>
                <a
                  href={tenantLeaseDownloadPath(lease.id)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
                <a
                  href={tenantLeaseDownloadPath(lease.id, { view: true })}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
                >
                  <FileText className="h-4 w-4" />
                  View PDF
                </a>
              </>
            ) : (
              <span className="inline-flex h-11 items-center justify-center rounded-2xl border border-dashed border-border px-4 text-sm text-muted-foreground">
                {contractDocument?.key
                  ? "PDF lease not available yet"
                  : "Contract not uploaded"}
              </span>
            )}
            <Link
              href="/dashboard/tenant/payments"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
            >
              Pay outstanding balance
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-3 border-b border-border px-5 py-5 sm:grid-cols-2 lg:grid-cols-5 sm:px-6">
        <SummaryMetric label="Monthly rent" value={formatMoney(lease.monthlyRent)} />
        <SummaryMetric label="Deposit" value={formatMoney(lease.deposit)} />
        <SummaryMetric label="Start date" value={formatDate(lease.startDate)} />
        <SummaryMetric
          label="End date"
          value={lease.endDate ? formatDate(lease.endDate) : "Open-ended"}
        />
        <SummaryMetric
          label="Outstanding"
          value={formatMoney(outstandingBalance)}
          note={`Due on day ${lease.dueDay}`}
        />
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl border border-border bg-muted/10 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground">Lease terms</h3>
          <dl className="mt-4 space-y-3">
            {[
              ["Property", lease.unit.property.name],
              ["Building", lease.unit.building?.name ?? "Not assigned"],
              ["Unit", lease.unit.houseNo],
              ["Rent due day", `Day ${lease.dueDay}`],
              ["Deposit", formatMoney(lease.deposit)],
              [
                "Contract file",
                contractDocument?.fileName ?? "Not uploaded",
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
              >
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="max-w-[55%] text-right text-sm font-semibold text-foreground">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-muted/10 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Recent rent charges
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest billing periods linked to this lease.
              </p>
            </div>
            <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {lease.rentCharges.length} records
            </span>
          </div>

          <div className="mt-4">
            <LeaseChargesTable charges={lease.rentCharges} />
          </div>
        </div>
      </div>
    </section>
  );
}