import Link from "next/link";
import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { ArrowUpRight, ReceiptText } from "lucide-react";
import {
  formatDate,
  formatMoney,
  getGatewayClasses,
  getPaymentCategory,
  getPaymentMethodLabel,
  getPaymentSubtitle,
  getPaymentTitle,
  getReceiptHref,
  getVerificationClasses,
} from "@/app/(app)/dashboard/tenant/payments/_lib/helpers";
import type { TenantPaymentsPageData } from "@/app/(app)/dashboard/tenant/payments/_lib/types";

export function RecentPayments({ data }: { data: TenantPaymentsPageData }) {
  const { filteredPayments } = data;

  return (
    <SurfaceCard className="p-4 sm:p-6 xl:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
            Recent Payments
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Last {filteredPayments.length} payment records
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3 lg:hidden">
        {filteredPayments.map((payment) => {
          const receiptHref = getReceiptHref(payment);

          return (
            <div
              key={payment.id}
              className="rounded-[22px] ed-theme-card border border-border bg-muted/35 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {getPaymentTitle(payment)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {getPaymentSubtitle(payment)}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold text-foreground">
                  {formatMoney(payment.amount)}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getGatewayClasses(
                    payment.gatewayStatus,
                  )}`}
                >
                  {payment.gatewayStatus}
                </span>

                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getVerificationClasses(
                    payment.verificationStatus,
                  )}`}
                >
                  {payment.verificationStatus}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Method
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {getPaymentMethodLabel(payment.method)}
                  </p>
                </div>

                <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatDate(payment.paidAt || payment.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Reference
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">
                    {payment.reference || payment.externalReference || "—"}
                  </p>
                </div>

                <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Category
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {getPaymentCategory(payment)}
                  </p>
                </div>
              </div>

              {receiptHref ? (
                <div className="mt-3">
                  <Link
                    href={receiptHref}
                    className="inline-flex items-center gap-2 rounded-[18px] border border-black/10 bg-card px-4 py-3 text-sm font-medium text-neutral-800"
                  >
                    <ReceiptText className="h-4 w-4" />
                    Download Receipt
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-5 hidden overflow-hidden rounded-[24px] ed-theme-card border border-border bg-card lg:block">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/30">
            <tr className="text-left text-muted-foreground">
              <th className="px-5 py-4 font-medium">Payment</th>
              <th className="px-5 py-4 font-medium">Category</th>
              <th className="px-5 py-4 font-medium">Method</th>
              <th className="px-5 py-4 font-medium">Amount</th>
              <th className="px-5 py-4 font-medium">Gateway</th>
              <th className="px-5 py-4 font-medium">Verification</th>
              <th className="px-5 py-4 font-medium">Date</th>
              <th className="px-5 py-4 font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => {
              const receiptHref = getReceiptHref(payment);

              return (
                <tr
                  key={payment.id}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        {getPaymentTitle(payment)}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {getPaymentSubtitle(payment)}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-neutral-600">
                    {getPaymentCategory(payment)}
                  </td>

                  <td className="px-5 py-4 text-neutral-600">
                    {getPaymentMethodLabel(payment.method)}
                  </td>

                  <td className="px-5 py-4 font-semibold text-foreground">
                    {formatMoney(payment.amount)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getGatewayClasses(
                        payment.gatewayStatus,
                      )}`}
                    >
                      {payment.gatewayStatus}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getVerificationClasses(
                        payment.verificationStatus,
                      )}`}
                    >
                      {payment.verificationStatus}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-neutral-600">
                    {formatDate(payment.paidAt || payment.createdAt)}
                  </td>

                  <td className="px-5 py-4">
                    {receiptHref ? (
                      <Link
                        href={receiptHref}
                        className="inline-flex items-center gap-1 font-medium text-foreground hover:text-foreground/80"
                      >
                        Download
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}