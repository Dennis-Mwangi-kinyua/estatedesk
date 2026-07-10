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

type TenantsTableProps = {
  tenants: CaretakerTenantsPageData["tenants"];
};

const thClass =
  "px-2 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground xl:px-3";
const tdClass = "px-2 py-3 align-middle xl:px-3";

export function TenantsTable({ tenants }: TenantsTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-border lg:block">
      {/* Fixed layout fits the panel — no page-level horizontal scroll */}
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col className="w-[22%]" />
          <col className="w-[14%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[11%]" />
          <col className="w-[11%]" />
          <col className="w-[12%]" />
          <col className="w-[8%]" />
        </colgroup>
        <thead className="border-b border-border bg-muted/30">
          <tr>
            <th className={thClass}>Tenant</th>
            <th className={thClass}>Building</th>
            <th className={thClass}>Unit</th>
            <th className={thClass}>Rent</th>
            <th className={thClass}>Lease</th>
            <th className={thClass}>Created</th>
            <th className={thClass}>Contact</th>
            <th className={`${thClass} text-right`}>
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {tenants.map((tenant) => {
            const currentLease = getCurrentLease(tenant.leases);
            const href = getCaretakerTenantHref(tenant);
            const building =
              currentLease?.unit?.building?.name?.trim() || "—";
            const unit = currentLease?.unit?.houseNo
              ? currentLease.unit.houseNo
              : "—";
            const property = currentLease?.unit?.property?.name?.trim();

            return (
              <tr
                key={tenant.id}
                className="bg-card transition hover:bg-muted/15"
              >
                <td className={tdClass}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-[11px] font-semibold text-white dark:bg-slate-200 dark:text-slate-900">
                      {tenantInitials(tenant.fullName)}
                    </div>
                    <div className="min-w-0">
                      <DeferredLink
                        href={href}
                        className="block truncate font-semibold text-foreground hover:text-primary hover:underline"
                      >
                        {tenant.fullName}
                      </DeferredLink>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {property || tenant.phone || "—"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className={`${tdClass} text-foreground`}>
                  <span className="block truncate" title={building}>
                    {building}
                  </span>
                </td>

                <td className={`${tdClass} font-medium text-foreground`}>
                  <span className="block truncate" title={unit}>
                    {unit}
                  </span>
                </td>

                <td className={`${tdClass} font-medium text-foreground`}>
                  <span className="block truncate">
                    {formatTenantRent(currentLease)}
                  </span>
                </td>

                <td className={tdClass}>
                  {currentLease ? (
                    <span
                      className={`inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${leaseStatusClasses(
                        currentLease.status,
                      )}`}
                    >
                      {currentLease.status.toLowerCase()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                <td className={`${tdClass} text-muted-foreground`}>
                  <span className="block truncate">
                    {formatDate(tenant.createdAt)}
                  </span>
                </td>

                <td className={tdClass}>
                  <ContactActions
                    phone={tenant.phone}
                    email={tenant.email}
                    compact
                  />
                </td>

                <td className={`${tdClass} text-right`}>
                  <DeferredLink
                    href={href}
                    className="inline-flex h-8 items-center rounded-xl border border-border bg-background px-2.5 text-xs font-semibold text-foreground transition hover:bg-muted/30"
                  >
                    Open
                  </DeferredLink>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
