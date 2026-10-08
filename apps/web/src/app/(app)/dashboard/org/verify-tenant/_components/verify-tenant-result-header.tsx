import { requestTenantTransferAction } from "../actions";
import { formatCurrency, formatDate, formatStatus, getStatusClasses } from "../_lib/helpers";
import type { VerifyTenantPageData } from "../_lib/types";

type TenantResult = VerifyTenantPageData["results"][number];

export function VerifyTenantResultHeader({
  tenant,
  search,
  isCurrentOrg,
  movedOut,
  transferRequest,
  totalPaid,
}: {
  tenant: TenantResult;
  search: string;
  isCurrentOrg: boolean;
  movedOut: boolean;
  transferRequest: TenantResult["transferRequests"][number] | null;
  totalPaid: number;
}) {
  return (
    <div className="border-b border-border p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-semibold text-foreground">
              {tenant.fullName}
            </h3>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                tenant.status,
              )}`}
            >
              {formatStatus(tenant.status)}
            </span>
            <span className="inline-flex rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {isCurrentOrg ? "Your org" : "Other org"}
            </span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {tenant.org.name}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {transferRequest?.status === "APPROVED" ? (
            <span className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium text-emerald-700">
              Transfer approved
            </span>
          ) : transferRequest?.status === "PENDING" ? (
            <span className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-4 text-sm font-medium text-amber-800">
              Transfer requested
            </span>
          ) : !isCurrentOrg && movedOut ? (
            <form action={requestTenantTransferAction}>
              <input
                type="hidden"
                name="sourceTenantId"
                value={tenant.id}
              />
              <input type="hidden" name="search" value={search} />
              <input
                type="hidden"
                name="message"
                value="Please approve transfer of this moved-out tenant record."
              />
              <button data-workspace-action="true"
                type="submit"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Request transfer
              </button>
            </form>
          ) : null}

          <span className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-muted/30 px-4 text-sm font-medium text-foreground/80">
            Verification view only
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="ed-theme-muted-panel rounded-2xl p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Phone
          </p>
          <p className="mt-1 break-all text-sm font-medium text-foreground">
            {tenant.phone}
          </p>
        </div>
        <div className="ed-theme-muted-panel rounded-2xl p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Email
          </p>
          <p className="mt-1 break-all text-sm font-medium text-foreground">
            {tenant.email ?? "—"}
          </p>
        </div>
        <div className="ed-theme-muted-panel rounded-2xl p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            National ID
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {tenant.nationalId ?? "—"}
          </p>
        </div>
        <div className="ed-theme-muted-panel rounded-2xl p-3">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Total paid
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatCurrency(totalPaid)}
          </p>
        </div>
      </div>

      {tenant.status === "BLACKLISTED" ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Blacklisted {formatDate(tenant.blacklistedAt)}.
          {tenant.blacklistReason
            ? ` ${tenant.blacklistReason}`
            : ""}
        </div>
      ) : null}
    </div>
  );
}