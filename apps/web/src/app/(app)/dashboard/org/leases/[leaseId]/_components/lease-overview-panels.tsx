import { EmojiSticker as VisualSticker } from "@/components/shared/emoji-sticker";
import Link from "@/components/navigation/workspace-link";
import { getOrgUnitHref } from "@/lib/units/url";
import { formatDate } from "../_lib/helpers";
import { encodePublicId } from "@/lib/public-id";
import type { LeaseDetailsData } from "../_lib/types";

export function LeaseOverviewPanels({ lease }: { lease: LeaseDetailsData["lease"] }) {
  return (
    <section className="grid min-w-0 items-start gap-4 xl:grid-cols-3">
      <div className="workspace-panel min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-1">
        <h2 className="flex items-center gap-3 text-base font-semibold"><VisualSticker label="Lease Overview" size="xs" />Lease Overview</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Lease reference</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.tenant.fullName} · Unit {lease.unit.houseNo}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Organization</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.org.name}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Start Date</dt>
            <dd className="min-w-0 break-words text-right font-medium">{formatDate(lease.startDate)}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">End Date</dt>
            <dd className="min-w-0 break-words text-right font-medium">{formatDate(lease.endDate)}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Created</dt>
            <dd className="min-w-0 break-words text-right font-medium">{formatDate(lease.createdAt)}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Updated</dt>
            <dd className="min-w-0 break-words text-right font-medium">{formatDate(lease.updatedAt)}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Notes</dt>
            <dd className="min-w-0 max-w-[60%] break-words text-right font-medium">
              {lease.notes ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="workspace-panel min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-1">
        <h2 className="flex items-center gap-3 text-base font-semibold"><VisualSticker label="Tenant" size="xs" />Tenant</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Name</dt>
            <dd className="min-w-0 break-words text-right font-medium">
              <Link
                href={`/dashboard/org/tenants/${encodeURIComponent(lease.tenant.slug ?? lease.tenant.id)}`}
                className="underline underline-offset-4"
              >
                {lease.tenant.fullName}
              </Link>
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Phone</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.tenant.phone}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Email</dt>
            <dd className="min-w-0 max-w-[60%] break-words text-right font-medium">
              {lease.tenant.email ?? "—"}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">National ID</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.tenant.nationalId ?? "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Company</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.tenant.companyName ?? "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Status</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.tenant.status}</dd>
          </div>
        </dl>
      </div>

      <div className="workspace-panel min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm xl:col-span-1">
        <h2 className="flex items-center gap-3 text-base font-semibold"><VisualSticker label="Unit & Property" size="xs" />Unit & Property</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Unit</dt>
            <dd className="min-w-0 break-words text-right font-medium">
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
            <dt className="shrink-0 text-muted-foreground">Unit Type</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.unit.type}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Property</dt>
            <dd className="min-w-0 max-w-[60%] break-words text-right font-medium">
              <Link
                href={`/dashboard/org/properties/${encodePublicId(lease.unit.property.id, "property")}`}
                className="underline underline-offset-4"
              >
                {lease.unit.property.name}
              </Link>
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Building</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.unit.building?.name ?? "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Bedrooms</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.unit.bedrooms ?? "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Bathrooms</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.unit.bathrooms ?? "—"}</dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 text-muted-foreground">Unit Status</dt>
            <dd className="min-w-0 break-words text-right font-medium">{lease.unit.status}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
