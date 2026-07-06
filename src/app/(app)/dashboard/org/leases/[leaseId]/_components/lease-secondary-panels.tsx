import Link from "next/link";
import { formatCurrency, formatDate } from "../_lib/helpers";
import type { LeaseDetailsData } from "../_lib/types";

export function LeaseSecondaryPanels({
  lease,
  currencyCode,
  totalRentCharges,
  totalRentPaid,
  totalRentBalance,
  totalTaxCharges,
}: {
  lease: LeaseDetailsData["lease"];
  currencyCode: string;
  totalRentCharges: number;
  totalRentPaid: number;
  totalRentBalance: number;
  totalTaxCharges: number;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-3">
      <div className="rounded-xl border bg-background p-5 shadow-sm">
        <h2 className="text-base font-semibold">Caretaker</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Assigned</dt>
            <dd className="font-medium">
              {lease.caretaker ? lease.caretaker.fullName : "—"}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="font-medium">{lease.caretaker?.phone ?? "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="max-w-[60%] text-right font-medium">
              {lease.caretaker?.email ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border bg-background p-5 shadow-sm">
        <h2 className="text-base font-semibold">Contract Document</h2>

        <Link href={`/dashboard/org/leases/${lease.id}/signing`} className="mt-3 inline-flex rounded-lg border px-3 py-2 text-sm font-semibold">
          Manage online signing
        </Link>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">File</dt>
            <dd className="max-w-[60%] text-right font-medium">
              {lease.contractDocument?.fileName ?? "—"}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium">
              {lease.contractDocument?.mimeType ?? "—"}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Uploaded</dt>
            <dd className="font-medium">
              {formatDate(lease.contractDocument?.createdAt)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border bg-background p-5 shadow-sm">
        <h2 className="text-base font-semibold">Financial Snapshot</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Rent Charges</dt>
            <dd className="font-medium">{lease.rentCharges.length}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Total Rent Due</dt>
            <dd className="font-medium">
              {formatCurrency(totalRentCharges, currencyCode)}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Total Rent Paid</dt>
            <dd className="font-medium">
              {formatCurrency(totalRentPaid, currencyCode)}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Rent Balance</dt>
            <dd className="font-medium">
              {formatCurrency(totalRentBalance, currencyCode)}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Tax Charges</dt>
            <dd className="font-medium">{lease.taxCharges.length}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Total Tax Due</dt>
            <dd className="font-medium">
              {formatCurrency(totalTaxCharges, currencyCode)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}