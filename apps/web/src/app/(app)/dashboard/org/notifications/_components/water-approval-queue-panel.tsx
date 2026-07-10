import { CheckCircle2, XCircle } from "lucide-react";
import {
  approveMeterReading,
  rejectMeterReading,
} from "@/app/(app)/dashboard/org/notifications/actions";
import {
  formatDateTime,
  formatMoney,
  toNumber,
} from "@/app/(app)/dashboard/org/notifications/_lib/helpers";
import type {
  ApprovalQueueItem,
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

type WaterApprovalQueuePanelProps = {
  membership: OrgContext;
  approvalQueue: ApprovalQueueItem[];
  approvalQueueCount: number;
};

export function WaterApprovalQueuePanel({
  membership,
  approvalQueue,
  approvalQueueCount,
}: WaterApprovalQueuePanelProps) {
  return (
    <section className={panelShellClassName}>
      <div className={panelBodyClassName}>
        <PanelHeader
        eyebrow="Review queue"
        title="Water reading approvals"
        description={
          approvalQueueCount > approvalQueue.length
            ? `Showing ${approvalQueue.length} of ${approvalQueueCount} submitted readings. Process caretaker submissions before tenant billing is issued.`
            : "Process caretaker submissions before tenant billing is generated."
        }
      />
      </div>

      <div className={`space-y-4 ${panelBodyClassName} pt-0`}>
        {approvalQueueCount === 0 ? (
          <EmptyState
            title="Nothing waiting for review"
            message="New water readings will appear here once submitted."
          />
        ) : (
          approvalQueue.map((reading) => {
            const rate = toNumber(reading.unit.property.waterRatePerUnit);
            const fixed = toNumber(reading.unit.property.waterFixedCharge);
            const projectedTotal = reading.unitsUsed * rate + fixed;

            return (
              <article key={reading.id} className={panelItemClassName}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={panelChipClassName}>
                        {reading.unit.property.name}
                      </span>
                      <span className={panelChipClassName}>
                        Unit {reading.unit.houseNo}
                      </span>
                      <span className={panelChipClassName}>
                        Awaiting review
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-foreground sm:text-lg">
                          Water reading for {reading.period}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Submitted by {reading.submittedBy.fullName} on{" "}
                          {formatDateTime(reading.createdAt, membership.org.timezone)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border bg-muted/10 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Projected bill
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {formatMoney(projectedTotal, membership.org.currencyCode)}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                      {[
                        { label: "Previous", value: reading.prevReading },
                        { label: "Current", value: reading.currentReading },
                        { label: "Units Used", value: reading.unitsUsed },
                        {
                          label: "Rate / Unit",
                          value: formatMoney(rate, membership.org.currencyCode),
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-border bg-muted/10 p-3"
                        >
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {item.label}
                          </dt>
                          <dd className="mt-2 text-sm font-semibold text-foreground">
                            {item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    {reading.photoAsset ? (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-muted/10">
                        <img
                          src={reading.photoAsset.key}
                          alt={`Meter evidence for unit ${reading.unit.houseNo}`}
                          className="max-h-64 w-full object-cover"
                        />
                        <div className="border-t border-border px-4 py-2 text-xs font-medium text-muted-foreground">
                          {reading.photoAsset.fileName}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="w-full space-y-3 lg:max-w-sm">
                    <form action={approveMeterReading}>
                      <input type="hidden" name="readingId" value={reading.id} />
                      <button
                        type="submit"
                        className={primaryButtonClassName}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve and issue tenant bill
                      </button>
                    </form>

                    <form action={rejectMeterReading} className="space-y-3">
                      <input type="hidden" name="readingId" value={reading.id} />
                      <label className="block">
                        <span className="sr-only">Rejection reason</span>
                        <textarea
                          name="rejectionReason"
                          required
                          rows={3}
                          minLength={10}
                          placeholder="Add a clear rejection reason for the caretaker..."
                          className={`${fieldClassName} min-h-[5.5rem] resize-y py-3`}
                        />
                      </label>
                      <button
                        type="submit"
                        className={secondaryButtonClassName}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject and send back
                      </button>
                    </form>
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