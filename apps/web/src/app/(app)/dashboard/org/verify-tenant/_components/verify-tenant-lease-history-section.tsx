import { formatCurrency, formatDate, formatStatus, getUnitLabel } from "../_lib/helpers";
import type { VerifyTenantPageData } from "../_lib/types";

type TenantResult = VerifyTenantPageData["results"][number];

export function VerifyTenantLeaseHistorySection({
  tenant,
}: {
  tenant: TenantResult;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-foreground">
          Lease history
        </h4>
        <span className="text-xs text-muted-foreground">
          {tenant.leases.length} shown
        </span>
      </div>

      {tenant.leases.length === 0 ? (
        <div className="ed-theme-muted-panel rounded-2xl p-4 text-sm text-neutral-600">
          No lease history recorded.
        </div>
      ) : (
        <div className="space-y-2">
          {tenant.leases.map((lease) => (
            <div
              key={lease.id}
              className="rounded-2xl ed-theme-card border border-border bg-muted/35 p-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {getUnitLabel(lease.unit)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(lease.startDate)} to{" "}
                    {formatDate(lease.endDate)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(lease.monthlyRent)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatStatus(lease.status)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}