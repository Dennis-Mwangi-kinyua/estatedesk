import { formatLedgerCurrency, formatLedgerDate } from "@/lib/ledger";
import { reverseVerifiedPaymentAction } from "../actions";
import type { PaymentsPageData } from "../_lib/types";
import {
  compactFieldClassName,
  formatStatus,
  panelShellClassName,
  reconciliationClasses,
} from "./payments-ui";

export function PaymentsRecentSection({
  ledger,
}: {
  ledger: PaymentsPageData["ledger"];
}) {
  return (
    <section className={panelShellClassName}>
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Recorded payments this month
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Verified and pending payments recorded during the current billing period.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/20 text-left">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Payer
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Target
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Gateway
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Verification
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Reconciliation
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Reference
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Correction
              </th>
            </tr>
          </thead>
          <tbody>
            {ledger.recentPayments.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-border/70 transition hover:bg-muted/10"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {payment.payerTenant?.fullName ??
                    payment.payerUser?.fullName ??
                    payment.payerName ??
                    payment.payerType}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatStatus(payment.targetType)}
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">
                  {formatLedgerCurrency(payment.amount)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatStatus(payment.gatewayStatus)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatStatus(payment.verificationStatus)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${reconciliationClasses(
                      payment.reconciliationStatus,
                    )}`}
                  >
                    {formatStatus(payment.reconciliationStatus)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {payment.reference ??
                    payment.externalReference ??
                    payment.checkoutRequestId ??
                    "-"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatLedgerDate(payment.paidAt ?? payment.createdAt)}
                </td>
                <td className="min-w-72 px-4 py-3">
                  {payment.verificationStatus === "VERIFIED" ? (
                    <form action={reverseVerifiedPaymentAction} className="grid gap-2">
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <input
                        name="reason"
                        required
                        minLength={10}
                        placeholder="Required correction reason"
                        className={`${compactFieldClassName} border-red-200 focus:border-red-400 dark:border-red-800`}
                      />
                      <button
                        type="submit"
                        className="h-9 rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/30"
                      >
                        Reverse payment
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {ledger.recentPayments.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  No payments recorded this month.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}