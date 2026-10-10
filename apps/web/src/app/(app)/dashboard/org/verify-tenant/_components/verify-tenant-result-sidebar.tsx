import { formatDate, formatStatus } from "../_lib/helpers";
import type { VerifyTenantPageData } from "../_lib/types";

type TenantResult = VerifyTenantPageData["results"][number];

export function VerifyTenantResultSidebar({
  tenant,
  paidCount,
  linkedOrgRecords,
}: {
  tenant: TenantResult;
  paidCount: number;
  linkedOrgRecords: NonNullable<TenantResult["identity"]>["tenants"];
}) {
  return (
    <div className="space-y-3">
      <div className="ed-theme-muted-panel rounded-2xl p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Payment signals
        </p>
        <p className="mt-2 text-sm text-foreground/80">
          {paidCount} verified or successful payments in the
          latest {tenant.payments.length} payment records.
        </p>
      </div>

      <div className="ed-theme-muted-panel rounded-2xl p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Move-out history
        </p>
        {tenant.moveOutNotices.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No move-out notices recorded.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {tenant.moveOutNotices.map((notice) => (
              <div
                key={notice.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-foreground/80">
                  {formatDate(notice.moveOutDate)}
                </span>
                <span className="font-medium text-foreground">
                  {formatStatus(notice.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ed-theme-muted-panel rounded-2xl p-4">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Previous organisations
        </p>
        {linkedOrgRecords.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No linked organisation records yet.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {linkedOrgRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 ed-full-name whitespace-normal break-words [overflow-wrap:anywhere] text-foreground/80">
                  {record.org.name}
                </span>
                <span className="shrink-0 font-medium text-foreground">
                  {formatStatus(record.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}