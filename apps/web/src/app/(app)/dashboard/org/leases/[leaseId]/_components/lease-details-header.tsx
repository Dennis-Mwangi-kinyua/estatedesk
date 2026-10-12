import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import Link from "@/components/navigation/workspace-link";
import { getLeaseStatusClass } from "../_lib/helpers";
import type { LeaseDetailsData } from "../_lib/types";

export function LeaseDetailsHeader({ lease }: { lease: LeaseDetailsData["lease"] }) {
  return (
    <div className="workspace-panel flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-6 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2 break-words text-sm text-muted-foreground">
          <Link href="/dashboard/org/leases" className="underline underline-offset-4">
            Leases
          </Link>
          <span>/</span>
          <span>{lease.tenant.fullName} · Unit {lease.unit.houseNo}</span>
        </div>

        <h1 className="mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
          <VisualSticker label="Lease agreement" size="xs" className="mr-2 align-middle" />Lease details
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Review lease information, linked tenant and unit details, charges,
          notices, and recent activity.
        </p>
      </div>

      <span
        className={`inline-flex w-fit shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium ${getLeaseStatusClass(
          lease.status
        )}`}
      >
        {lease.status}
      </span>
    </div>
  );
}
