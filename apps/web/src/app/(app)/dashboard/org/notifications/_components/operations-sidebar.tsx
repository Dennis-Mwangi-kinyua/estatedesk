import { CreditCard } from "lucide-react";
import {
  formatDateTime,
  formatEnumLabel,
  formatMoney,
  getPaymentLabel,
  toNumber,
} from "@/app/(app)/dashboard/org/notifications/_lib/helpers";
import type {
  OrgContext,
  PaymentItem,
} from "@/app/(app)/dashboard/org/notifications/_lib/types";
import {
  EmptyState,
  PanelHeader,
  PaymentStatusBadge,
  panelBodyClassName,
  panelItemClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/org/notifications/_components/notifications-ui";

type OperationsSidebarProps = {
  membership: OrgContext;
  approvalQueueCount: number;
  recentPayments: PaymentItem[];
  sentCount: number;
  failedCount: number;
  unreadCount: number;
};

export function OperationsSidebar({
  membership,
  approvalQueueCount,
  recentPayments,
  sentCount,
  failedCount,
  unreadCount,
}: OperationsSidebarProps) {
  return (
    <aside className="space-y-5 xl:col-span-4">
      <section className={panelShellClassName}>
        <div className={`border-b border-border ${panelBodyClassName}`}>
          <PanelHeader
            eyebrow="Collections"
            title="Recent payment activity"
            description="Latest rent, water, and tax payment signals across the organization."
          />
        </div>

        <div className={`space-y-3 ${panelBodyClassName}`}>
          {recentPayments.length === 0 ? (
            <EmptyState
              title="No payment activity yet"
              message="Confirmed and pending collections will show here once they arrive."
            />
          ) : (
            recentPayments.map((payment) => (
              <article key={payment.id} className={panelItemClassName}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/20 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="truncate text-sm font-semibold text-foreground">
                          {payment.payerTenant.fullName}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {getPaymentLabel(payment)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatMoney(
                          toNumber(payment.amount),
                          membership.org.currencyCode,
                        )}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <PaymentStatusBadge
                        gatewayStatus={payment.gatewayStatus}
                        verificationStatus={payment.verificationStatus}
                      />
                      <span className="text-xs text-muted-foreground">
                        {formatEnumLabel(payment.method)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {formatDateTime(
                          payment.paidAt ?? payment.createdAt,
                          membership.org.timezone,
                        )}
                      </span>
                      {(payment.reference || payment.externalReference) && (
                        <>
                          <span>•</span>
                          <span className="truncate">
                            Ref: {payment.reference ?? payment.externalReference}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className={panelShellClassName}>
        <div className={panelBodyClassName}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Snapshot
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
            Operations at a glance
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {approvalQueueCount > 0
              ? `${approvalQueueCount} approvals are waiting for action. Prioritize submitted readings to keep billing current.`
              : "No pending water approvals right now. The queue is clear."}
          </p>

          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground">Delivery health</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{sentCount}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                successful sends in the current feed
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/10 p-4">
              <p className="text-xs text-muted-foreground">Attention needed</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {failedCount + unreadCount}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                failed or unread items to review
              </p>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}