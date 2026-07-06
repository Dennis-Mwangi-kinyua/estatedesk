import Link from "next/link";
import { getLeaseStatusClass } from "../_lib/helpers";
import type { LeaseDetailsData } from "../_lib/types";

export function LeaseDetailsHeader({ lease }: { lease: LeaseDetailsData["lease"] }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/org/leases" className="underline underline-offset-4">
            Leases
          </Link>
          <span>/</span>
          <span>{lease.id}</span>
        </div>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Lease Details
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Review lease information, linked tenant and unit details, charges,
          notices, and recent activity.
        </p>
      </div>

      <span
        className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-medium ${getLeaseStatusClass(
          lease.status
        )}`}
      >
        {lease.status}
      </span>
    </div>
  );
}