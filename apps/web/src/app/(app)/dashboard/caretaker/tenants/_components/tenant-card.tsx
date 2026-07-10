import type { ReactNode } from "react";
import { ChevronRight, Home } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import { ContactActions } from "@/app/(app)/dashboard/caretaker/_components/contact-actions";
import { getCaretakerTenantHref } from "@/app/(app)/dashboard/caretaker/_lib/paths";
import {
  formatDate,
  formatTenantRent,
  getCurrentLease,
  leaseStatusClasses,
  statusClasses,
  tenantInitials,
} from "../_lib/helpers";
import type { CaretakerTenantsPageData } from "../_lib/types";

type TenantItem = CaretakerTenantsPageData["tenants"][number];

export function TenantCard({ tenant }: { tenant: TenantItem }) {
  const currentLease = getCurrentLease(tenant.leases);
  const href = getCaretakerTenantHref(tenant);
  const building = currentLease?.unit?.building?.name?.trim() || "—";
  const unit = currentLease?.unit?.houseNo
    ? `Unit ${currentLease.unit.houseNo}`
    : "—";
  const property = currentLease?.unit?.property?.name?.trim() || "No property";
  const rent = formatTenantRent(currentLease);

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/20 hover:shadow-md">
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-sm font-semibold tracking-wide text-white shadow-sm dark:from-slate-200 dark:to-slate-400 dark:text-slate-900"
            aria-hidden
          >
            {tenantInitials(tenant.fullName)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <DeferredLink
                  href={href}
                  className="block truncate text-base font-semibold tracking-tight text-foreground transition group-hover:text-primary sm:text-lg"
                >
                  {tenant.fullName}
                </DeferredLink>
                <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                  <Home className="h-3.5 w-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{property}</span>
                </div>
              </div>

              <span
                className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClasses(
                  tenant.status,
                )}`}
              >
                {tenant.status.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed grid — no horizontal scroll; labels stay intact */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <MetaChip label="Building" value={building} />
          <MetaChip label="Unit" value={unit} />
          <MetaChip label="Rent" value={rent} />
          <MetaChip
            label="Lease"
            value={
              currentLease ? (
                <span
                  className={`inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${leaseStatusClasses(
                    currentLease.status,
                  )}`}
                >
                  {currentLease.status.toLowerCase()}
                </span>
              ) : (
                "—"
              )
            }
          />
          <MetaChip
            label="Created"
            value={formatDate(tenant.createdAt)}
            className="col-span-2 sm:col-span-1"
          />
        </div>

        <div className="mt-4 border-t border-border/80 pt-4">
          <ContactActions phone={tenant.phone} email={tenant.email} />
        </div>

        <DeferredLink
          href={href}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl border border-border bg-background text-sm font-semibold text-foreground transition hover:bg-muted/30 sm:h-10"
        >
          View tenant
          <ChevronRight className="h-4 w-4" />
        </DeferredLink>
      </div>
    </article>
  );
}

function MetaChip({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-border bg-muted/15 px-3 py-2.5 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 truncate text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}
