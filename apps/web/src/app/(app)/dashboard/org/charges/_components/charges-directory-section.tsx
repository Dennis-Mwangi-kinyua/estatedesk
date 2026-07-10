import { DeferredLink } from "@/components/navigation/app-links";
import { formatCurrency, formatDate } from "../_lib/helpers";
import type { OrgRentCharge } from "../_lib/types";
import { ChargeStatusPill, panelShellClassName } from "./charges-ui";
import { ChargesEmptyState } from "./charges-empty-state";

export function ChargesDirectorySection({ charges }: { charges: OrgRentCharge[] }) {
  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          All rent charges
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Every rent period across active leases, with tenant, property, and balance
          details.
        </p>
      </div>

      {charges.length === 0 ? (
        <ChargesEmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/20">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Period
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Tenant
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Property
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Building
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Unit
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Amount due
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Paid
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Balance
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Due date
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Lease
                </th>
              </tr>
            </thead>
            <tbody>
              {charges.map((charge) => (
                <tr
                  key={charge.id}
                  className="border-b border-border/70 transition hover:bg-muted/10"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {charge.period}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {charge.chargeType}
                  </td>
                  <td className="px-4 py-3">
                    <DeferredLink
                      href={`/dashboard/org/tenants/${charge.lease.tenant.id}`}
                      className="font-medium text-foreground transition hover:text-primary"
                    >
                      {charge.lease.tenant.fullName}
                    </DeferredLink>
                  </td>
                  <td className="px-4 py-3">
                    <DeferredLink
                      href={`/dashboard/org/properties/${charge.lease.unit.property.id}`}
                      className="font-medium text-foreground transition hover:text-primary"
                    >
                      {charge.lease.unit.property.name}
                    </DeferredLink>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {charge.lease.unit.building?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {charge.lease.unit.houseNo}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatCurrency(charge.amountDue)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatCurrency(charge.amountPaid)}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatCurrency(charge.balance)}
                  </td>
                  <td className="px-4 py-3">
                    <ChargeStatusPill status={charge.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(charge.dueDate)}
                  </td>
                  <td className="px-4 py-3">
                    <DeferredLink
                      href={`/dashboard/org/leases/${charge.lease.id}`}
                      className="text-sm font-medium text-primary transition hover:text-primary/80"
                    >
                      View lease
                    </DeferredLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}