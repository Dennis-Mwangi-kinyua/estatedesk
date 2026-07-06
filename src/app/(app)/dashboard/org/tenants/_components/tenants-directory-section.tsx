import { DeferredLink } from "@/components/navigation/app-links";
import { getTenantDetails } from "../_lib/helpers";
import type { TenantsPageData } from "../_lib/types";
import { TenantsEmptyState } from "./tenants-empty-state";
import { TenantsPagination } from "./tenants-pagination";
import {
  buttonSecondaryClassName,
  panelShellClassName,
  TenantCard,
  TenantStatusPill,
} from "./tenants-ui";

export function TenantsDirectorySection({ data }: { data: TenantsPageData }) {
  const hasSearch = Boolean(data.search.trim()) || data.status !== "ALL";

  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Tenant directory
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Showing tenant location, apartment/block, house/unit, lease, and caretaker.
            </p>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {data.totalTenants.toLocaleString()} found
          </span>
        </div>
      </div>

      {data.tenants.length === 0 ? (
        <TenantsEmptyState hasSearch={hasSearch} />
      ) : (
        <>
          <div className="grid gap-3 p-4 xl:hidden">
            {data.tenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                currencyCode={data.currencyCode}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto xl:block">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/20 text-left">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Tenant
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Property / location
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Apartment
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Unit
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Caretaker
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Lease
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.tenants.map((tenant) => {
                  const details = getTenantDetails(tenant, data.currencyCode);

                  return (
                    <tr
                      key={tenant.id}
                      className="border-b border-border/70 align-top transition hover:bg-muted/10"
                    >
                      <td className="px-5 py-4">
                        <DeferredLink
                          href={`/dashboard/org/tenants/${tenant.id}`}
                          className="font-semibold text-foreground transition hover:text-primary"
                        >
                          {tenant.fullName}
                        </DeferredLink>
                        <p className="mt-1 text-xs text-muted-foreground">{tenant.phone}</p>
                        <p className="mt-1 max-w-[180px] truncate text-xs text-muted-foreground">
                          {tenant.email ?? "No email"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{details.property}</p>
                        <p className="mt-1 max-w-[180px] text-xs leading-5 text-muted-foreground">
                          {details.location}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {details.apartment}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{details.unit}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {details.unitType}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{details.caretaker}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {details.caretakerContact}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-foreground">{details.rent}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Due day {details.dueDay}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <TenantStatusPill status={String(tenant.status)} />
                      </td>
                      <td className="px-5 py-4">
                        <DeferredLink
                          href={`/dashboard/org/tenants/${tenant.id}`}
                          className={buttonSecondaryClassName}
                        >
                          View
                        </DeferredLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="border-t border-border px-5 py-4 sm:px-6">
        <TenantsPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.totalTenants}
          search={data.search}
          status={data.status}
          created={data.created}
        />
      </div>
    </section>
  );
}