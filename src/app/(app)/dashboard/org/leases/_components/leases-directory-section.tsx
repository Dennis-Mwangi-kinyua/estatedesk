import { DeferredLink } from "@/components/navigation/app-links";
import { getOrgUnitHref } from "@/lib/units/url";
import { formatCurrency, formatDate } from "../_lib/helpers";
import type { OrgLeasesPageData } from "../_lib/types";
import { LeasesEmptyState } from "./leases-empty-state";
import { LeaseStatusPill, panelShellClassName } from "./leases-ui";
import { LeasesPagination } from "./leases-pagination";

export function LeasesDirectorySection({ data }: { data: OrgLeasesPageData }) {
  const {
    leases,
    currentPage,
    totalPages,
    showingFrom,
    showingTo,
    totalLeases,
  } = data;

  return (
    <section className={`${panelShellClassName} space-y-0`}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          All leases
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Every tenancy record with tenant, property, unit, rent, and status details.
        </p>
      </div>

      {leases.length === 0 ? (
        <LeasesEmptyState />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/20">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Lease
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
                    Monthly rent
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Deposit
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Due day
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Start
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    End
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Caretaker
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Contract
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {leases.map((lease) => (
                  <tr
                    key={lease.id}
                    className="border-b border-border/70 transition hover:bg-muted/10"
                  >
                    <td className="px-4 py-3 font-medium">
                      <DeferredLink
                        href={`/dashboard/org/leases/${lease.id}`}
                        className="text-foreground transition hover:text-primary"
                      >
                        {lease.id.slice(0, 8)}…
                      </DeferredLink>
                    </td>

                    <td className="px-4 py-3">
                      <DeferredLink
                        href={`/dashboard/org/tenants/${lease.tenant.id}`}
                        className="font-medium text-foreground transition hover:text-primary"
                      >
                        {lease.tenant.fullName}
                      </DeferredLink>
                    </td>

                    <td className="px-4 py-3">
                      <DeferredLink
                        href={`/dashboard/org/properties/${lease.unit.property.id}`}
                        className="font-medium text-foreground transition hover:text-primary"
                      >
                        {lease.unit.property.name}
                      </DeferredLink>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {lease.unit.building?.name ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      <DeferredLink
                        href={getOrgUnitHref({
                          id: lease.unit.id,
                          houseNo: lease.unit.houseNo,
                          buildingName: lease.unit.building?.name,
                          propertyName: lease.unit.property.name,
                        })}
                        className="font-medium text-foreground transition hover:text-primary"
                      >
                        {lease.unit.houseNo}
                      </DeferredLink>
                    </td>

                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatCurrency(
                        lease.monthlyRent,
                        lease.org.currencyCode ?? "KES",
                      )}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCurrency(
                        lease.deposit,
                        lease.org.currencyCode ?? "KES",
                      )}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">{lease.dueDay}</td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(lease.startDate)}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(lease.endDate)}
                    </td>

                    <td className="px-4 py-3">
                      {lease.caretaker ? (
                        <DeferredLink
                          href={`/staff/${lease.caretaker.id}`}
                          className="font-medium text-foreground transition hover:text-primary"
                        >
                          {lease.caretaker.fullName}
                        </DeferredLink>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {lease.contractDocument?.fileName ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      <LeaseStatusPill status={lease.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border px-5 py-4 sm:px-6">
            <LeasesPagination
              currentPage={currentPage}
              totalPages={totalPages}
              showingFrom={showingFrom}
              showingTo={showingTo}
              totalLeases={totalLeases}
            />
          </div>
        </>
      )}
    </section>
  );
}