import Link from "next/link";
import { getOrgUnitHref } from "@/lib/units/url";
import { formatDate } from "../_lib/helpers";
import type { LeaseDetailsData } from "../_lib/types";

export function LeaseOverviewPanels({ lease }: { lease: LeaseDetailsData["lease"] }) {
  return (
    <section className="grid gap-6 xl:grid-cols-3">
      <div className="rounded-xl border bg-background p-5 shadow-sm xl:col-span-1">
        <h2 className="text-base font-semibold">Lease Overview</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Lease ID</dt>
            <dd className="font-medium">{lease.id}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Organization</dt>
            <dd className="text-right font-medium">{lease.org.name}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Start Date</dt>
            <dd className="font-medium">{formatDate(lease.startDate)}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">End Date</dt>
            <dd className="font-medium">{formatDate(lease.endDate)}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="font-medium">{formatDate(lease.createdAt)}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Updated</dt>
            <dd className="font-medium">{formatDate(lease.updatedAt)}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Notes</dt>
            <dd className="max-w-[60%] text-right font-medium">
              {lease.notes ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border bg-background p-5 shadow-sm xl:col-span-1">
        <h2 className="text-base font-semibold">Tenant</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="text-right font-medium">
              <Link
                href={`/dashboard/org/tenants/${lease.tenant.id}`}
                className="underline underline-offset-4"
              >
                {lease.tenant.fullName}
              </Link>
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="font-medium">{lease.tenant.phone}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="max-w-[60%] text-right font-medium">
              {lease.tenant.email ?? "—"}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">National ID</dt>
            <dd className="font-medium">{lease.tenant.nationalId ?? "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Company</dt>
            <dd className="font-medium">{lease.tenant.companyName ?? "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{lease.tenant.status}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border bg-background p-5 shadow-sm xl:col-span-1">
        <h2 className="text-base font-semibold">Unit & Property</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Unit</dt>
            <dd className="text-right font-medium">
              <Link
                href={getOrgUnitHref({
                  id: lease.unit.id,
                  houseNo: lease.unit.houseNo,
                  buildingName: lease.unit.building?.name,
                  propertyName: lease.unit.property.name,
                })}
                className="underline underline-offset-4"
              >
                {lease.unit.houseNo}
              </Link>
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Unit Type</dt>
            <dd className="font-medium">{lease.unit.type}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Property</dt>
            <dd className="max-w-[60%] text-right font-medium">
              <Link
                href={`/properties/${lease.unit.property.id}`}
                className="underline underline-offset-4"
              >
                {lease.unit.property.name}
              </Link>
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Building</dt>
            <dd className="font-medium">{lease.unit.building?.name ?? "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Bedrooms</dt>
            <dd className="font-medium">{lease.unit.bedrooms ?? "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Bathrooms</dt>
            <dd className="font-medium">{lease.unit.bathrooms ?? "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted-foreground">Unit Status</dt>
            <dd className="font-medium">{lease.unit.status}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}