import { FileText, Home, Phone } from "lucide-react";
import { DeferredLink } from "@/components/navigation/app-links";
import { getCaretakerTenantHref } from "@/app/(app)/dashboard/caretaker/_lib/paths";
import { ContactActions } from "@/app/(app)/dashboard/caretaker/_components/contact-actions";
import { formatCurrency, statusClasses } from "../_lib/helpers";
import type { CaretakerTenantsPageData } from "../_lib/types";

type TenantMobileListProps = {
  tenants: CaretakerTenantsPageData["tenants"];
};

export function TenantMobileList({ tenants }: TenantMobileListProps) {
  return (
    <div className="space-y-3 md:hidden">
      {tenants.map((tenant) => {
        const currentLease =
          tenant.leases.find((lease) => lease.status === "ACTIVE") ??
          tenant.leases[0];
        const rent =
          currentLease?.monthlyRent != null
            ? formatCurrency(currentLease.monthlyRent)
            : currentLease?.unit?.rentAmount != null
              ? formatCurrency(currentLease.unit.rentAmount)
              : "—";
        return (
          <article
            key={tenant.id}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DeferredLink
                  href={getCaretakerTenantHref(tenant.id)}
                  className="truncate text-base font-semibold text-foreground"
                >
                  {tenant.fullName}
                </DeferredLink>
                <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Home className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {[
                      currentLease?.unit?.property?.name,
                      currentLease?.unit?.building?.name,
                      currentLease?.unit?.houseNo
                        ? `Unit ${currentLease.unit.houseNo}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" / ") || "No unit"}
                  </span>
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize ${statusClasses(
                  tenant.status,
                )}`}
              >
                {tenant.status.toLowerCase()}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-border bg-muted/10 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  Phone
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {tenant.phone}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/10 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Rent
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {rent}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <ContactActions phone={tenant.phone} email={tenant.email} />
            </div>
          </article>
        );
      })}
    </div>
  );
}