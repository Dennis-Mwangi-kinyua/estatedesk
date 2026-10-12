import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import Link from "next/link";
import { formatCurrency, formatDate } from "../_lib/helpers";
import type { LeaseDetailsData } from "../_lib/types";
import { encodePublicId } from "@/lib/public-id";

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
    <section className="grid min-w-0 items-start gap-4 xl:grid-cols-3">
      <div className="workspace-panel min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-3 text-base font-semibold"><VisualSticker label="Caretaker" size="xs" />Caretaker</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Assigned</dt>
            <dd className="min-w-0 break-words text-right font-medium">
              {lease.caretaker ? lease.caretaker.fullName : "—"}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Phone</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.caretaker?.phone ?? "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Email</dt>
            <dd className="min-w-0 max-w-[60%] break-words text-right font-medium">
              {lease.caretaker?.email ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="workspace-panel min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-3 text-base font-semibold"><VisualSticker label="Contract Document" size="xs" />Contract Document</h2>

        <Link data-workspace-action="true" href={`/dashboard/org/leases/${encodePublicId(lease.id, "lease")}/signing`} className="mt-3 inline-flex rounded-lg border px-3 py-2 text-sm font-semibold">
          Manage online signing
        </Link>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">File</dt>
            <dd className="min-w-0 max-w-[60%] break-words text-right font-medium">
              {lease.contractDocument?.fileName ?? "—"}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Type</dt>
            <dd className="min-w-0 break-words text-right font-medium">
              {lease.contractDocument?.mimeType ?? "—"}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Uploaded</dt>
            <dd className="min-w-0 break-words text-right font-medium">
              {formatDate(lease.contractDocument?.createdAt)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="workspace-panel min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="flex items-center gap-3 text-base font-semibold"><VisualSticker label="Financial Snapshot" size="xs" />Financial Snapshot</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Rent Charges</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.rentCharges.length}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Total Rent Due</dt>
            <dd className="min-w-0 break-words text-right font-medium">
              {formatCurrency(totalRentCharges, currencyCode)}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Total Rent Paid</dt>
            <dd className="min-w-0 break-words text-right font-medium">
              {formatCurrency(totalRentPaid, currencyCode)}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Rent Balance</dt>
            <dd className="min-w-0 break-words text-right font-medium">
              {formatCurrency(totalRentBalance, currencyCode)}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Tax Charges</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.taxCharges.length}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Total Tax Due</dt>
            <dd className="min-w-0 break-words text-right font-medium">
              {formatCurrency(totalTaxCharges, currencyCode)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
