import { DeferredLink } from "@/components/navigation/app-links";
import { getCaretakerTenantHref } from "@/app/(app)/dashboard/caretaker/_lib/paths";
import { ContactActions } from "@/app/(app)/dashboard/caretaker/_components/contact-actions";
import {
  formatCurrency,
  formatDate,
  statusClasses,
} from "../_lib/helpers";
import type { CaretakerTenantsPageData } from "../_lib/types";

type TenantsTableProps = {
  tenants: CaretakerTenantsPageData["tenants"];
};

export function TenantsTable({ tenants }: TenantsTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/20">
            <tr className="text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Tenant</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Building</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Monthly rent</th>
              <th className="px-4 py-3 font-medium">Lease status</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {tenants.map((tenant) => {
              const currentLease =
                tenant.leases.find((lease) => lease.status === "ACTIVE") ??
                tenant.leases[0];

              return (
                <tr key={tenant.id}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <DeferredLink
                      href={getCaretakerTenantHref(tenant.id)}
                      className="text-primary hover:underline"
                    >
                      {tenant.fullName}
                    </DeferredLink>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="space-y-2">
                      <p>{tenant.phone}</p>
                      <p>{tenant.email ?? "—"}</p>
                      <ContactActions
                        phone={tenant.phone}
                        email={tenant.email}
                        compact
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs capitalize ${statusClasses(
                        tenant.status,
                      )}`}
                    >
                      {tenant.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {currentLease?.unit?.property?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {currentLease?.unit?.building?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {currentLease?.unit?.houseNo ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {currentLease?.monthlyRent != null
                      ? formatCurrency(currentLease.monthlyRent)
                      : currentLease?.unit?.rentAmount != null
                        ? formatCurrency(currentLease.unit.rentAmount)
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {currentLease ? currentLease.status.toLowerCase() : "no lease"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(tenant.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}