import { formatCurrency, formatDate, formatStatus } from "../_lib/helpers";
import type { VerifyTenantPageData } from "../_lib/types";

type IdentityHistoryRecord = NonNullable<
  VerifyTenantPageData["results"][number]["identity"]
>["historyRecords"][number];

export function VerifyTenantIdentityHistorySection({
  identityHistory,
}: {
  identityHistory: IdentityHistoryRecord[];
}) {
  if (identityHistory.length === 0) return null;

  return (
    <div className="border-t border-border p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-foreground">
          Retained tenancy records
        </h4>
        <span className="text-xs text-muted-foreground">
          {identityHistory.length} shown
        </span>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {identityHistory.map((record) => (
          <div
            key={record.id}
            className="rounded-2xl ed-theme-card border border-border bg-muted/35 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {record.org.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[
                    record.propertyName,
                    record.buildingName,
                    record.unitHouseNo
                      ? `Unit ${record.unitHouseNo}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" / ") || "Unit not recorded"}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-border bg-card px-2 py-1 text-[11px] font-medium text-foreground/80">
                {formatStatus(record.status)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-neutral-400">Lease</p>
                <p className="mt-0.5 font-medium text-neutral-800">
                  {formatDate(record.leaseStartDate)} to{" "}
                  {formatDate(record.leaseEndDate)}
                </p>
              </div>
              <div>
                <p className="text-neutral-400">Move-out</p>
                <p className="mt-0.5 font-medium text-neutral-800">
                  {formatDate(record.moveOutDate)}
                </p>
              </div>
              <div>
                <p className="text-neutral-400">Rent</p>
                <p className="mt-0.5 font-medium text-neutral-800">
                  {record.monthlyRent
                    ? formatCurrency(record.monthlyRent)
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-neutral-400">Paid</p>
                <p className="mt-0.5 font-medium text-neutral-800">
                  {formatCurrency(record.totalPaid)} ·{" "}
                  {record.paymentCount} records
                </p>
              </div>
            </div>

            {record.notes ? (
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-neutral-600">
                {record.notes}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}