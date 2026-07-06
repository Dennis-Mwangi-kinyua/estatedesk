import Link from "next/link";
import { ArrowUpRight, ReceiptText } from "lucide-react";
import { InAppGuideLink } from "@/components/help/in-app-guide-link";
import { formatCurrency, formatDate, getStatusTone } from "@/lib/tenant/tenant-format";
import type { TenantDashboardPaymentItem } from "../_lib/types";
import { panelShellClassName } from "./tenant-dashboard-ui";

type TenantDashboardPaymentsProps = {
  recentPayments: TenantDashboardPaymentItem[];
};

export function TenantDashboardPayments({
  recentPayments,
}: TenantDashboardPaymentsProps) {
  return (
    <section className={panelShellClassName}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Payments
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            Recent activity
          </h2>
        </div>
        <Link
          href="/dashboard/tenant/payments"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-muted/35"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-0 divide-y divide-border">
        {recentPayments.length === 0 ? (
          <div className="px-5 py-8 text-sm text-muted-foreground sm:px-6">
            <p>No payments recorded yet.</p>
            <div className="mt-3">
              <InAppGuideLink topic="rent" workspace="tenant" />
            </div>
          </div>
        ) : (
          recentPayments.map((payment) => {
            const receiptHref = payment.receipt?.id
              ? `/dashboard/tenant/receipts/${payment.receipt.id}`
              : null;

            return (
              <article
                key={payment.id}
                className="px-5 py-4 sm:px-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(payment.amount as never)}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {payment.method} • {payment.reference ?? "No reference"} •{" "}
                      {formatDate(payment.paidAt ?? payment.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(
                      payment.verificationStatus,
                    )}`}
                  >
                    {payment.verificationStatus}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Gateway: {payment.gatewayStatus}
                  </span>
                  {receiptHref ? (
                    <Link
                      href={receiptHref}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/15 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-muted/30"
                    >
                      <ReceiptText className="h-3.5 w-3.5" />
                      Receipt
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}