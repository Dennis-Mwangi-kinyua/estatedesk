import Link from "next/link";
import { confirmMoveOutAction } from "@/app/(app)/dashboard/org/notifications/actions";
import {
  formatDateTime,
  formatEnumLabel,
  formatMoney,
  toNumber,
} from "@/app/(app)/dashboard/org/notifications/_lib/helpers";
import type {
  MoveOutQueueItem,
  OrgContext,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";
import {
  EmptyState,
  PanelHeader,
  fieldClassName,
  panelBodyClassName,
  panelChipClassName,
  panelItemClassName,
  panelShellClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/app/(app)/dashboard/org/notifications/_components/notifications-ui";
import { encodePublicId } from "@/lib/public-id";

type MoveOutQueuePanelProps = {
  membership: OrgContext;
  moveOutQueue: MoveOutQueueItem[];
};

export function MoveOutQueuePanel({
  membership,
  moveOutQueue,
}: MoveOutQueuePanelProps) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <PanelHeader
          eyebrow="Move-out desk"
          title="Notice review queue"
          description="Tenant move-out notices submitted from the tenant portal."
        />
      </div>

      <div className={`space-y-4 ${panelBodyClassName} pt-0`}>
        {moveOutQueue.length === 0 ? (
          <EmptyState
            title="No move-outs waiting"
            message="New tenant notices will appear here immediately after submission."
          />
        ) : (
          moveOutQueue.map((notice) => {
            const rentBalance = notice.lease.rentCharges.reduce(
              (sum, charge) => sum + toNumber(charge.balance),
              0,
            );
            const waterBalance = notice.tenant.waterBills.reduce(
              (sum, bill) => sum + toNumber(bill.total),
              0,
            );
            const clearanceBalance = rentBalance + waterBalance;

            return (
              <article key={notice.id} className={panelItemClassName}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={panelChipClassName}>
                        {notice.lease.unit.property.name}
                      </span>
                      <span className={panelChipClassName}>
                        Unit {notice.lease.unit.houseNo}
                      </span>
                      <span className={panelChipClassName}>
                        {formatEnumLabel(notice.status)}
                      </span>
                      <span className={panelChipClassName}>
                        {clearanceBalance <= 0 ? "Clearance ready" : "Balance pending"}
                      </span>
                    </div>

                    <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">
                      {notice.tenant.fullName}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Move-out date {formatDateTime(notice.moveOutDate, membership.org.timezone)}
                    </p>
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {notice.tenant.phone}
                      {notice.tenant.email ? ` / ${notice.tenant.email}` : ""}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-border bg-muted/10 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Rent Balance
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {formatMoney(rentBalance, membership.org.currencyCode)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-muted/10 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Water Balance
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {formatMoney(waterBalance, membership.org.currencyCode)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-muted/10 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Clearance
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {formatMoney(clearanceBalance, membership.org.currencyCode)}
                        </p>
                      </div>
                    </div>

                    {notice.notes ? (
                      <div className="mt-4 rounded-2xl border border-border bg-muted/10 p-3 text-sm text-muted-foreground">
                        {notice.notes}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-xs lg:grid-cols-1">
                    <Link href={`/dashboard/org/tenants/${notice.tenant.id}`} className={primaryButtonClassName}>
                      Review tenant
                    </Link>
                    {notice.inspection ? (
                      <Link
                        href={`/dashboard/org/inspections/${encodePublicId(
                          notice.inspection.id,
                          "inspection",
                        )}`}
                        className={secondaryButtonClassName}
                      >
                        View inspection
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard/org/move-outs"
                        className={secondaryButtonClassName}
                      >
                        Schedule inspection
                      </Link>
                    )}
                    {notice.status === "INSPECTION_COMPLETED" ? (
                      <form
                        action={confirmMoveOutAction}
                        className="grid gap-2 sm:col-span-2 lg:col-span-1"
                      >
                        <input type="hidden" name="noticeId" value={notice.id} />
                        <input
                          name="notes"
                          placeholder="Closeout notes"
                          className={fieldClassName}
                        />
                        <button
                          type="submit"
                          className={primaryButtonClassName}
                        >
                          Confirm move-out
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-border bg-muted/10 px-4 py-3 text-sm font-medium text-muted-foreground sm:col-span-2 lg:col-span-1"
                      >
                        Confirm after inspection
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}