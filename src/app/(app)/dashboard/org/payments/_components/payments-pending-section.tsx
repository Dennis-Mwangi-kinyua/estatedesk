import {
  rejectTenantPaymentAction,
  verifyTenantPaymentAction,
} from "../actions";
import type { PaymentsPageData } from "../_lib/types";
import {
  buttonPrimaryClassName,
  compactFieldClassName,
  fieldClassName,
  formatStatus,
  getTransactionMessage,
  panelShellClassName,
} from "./payments-ui";
import { formatLedgerCurrency, formatLedgerDate } from "@/lib/ledger";

export function PaymentsPendingSection({
  pendingPayments,
  q,
}: {
  pendingPayments: PaymentsPageData["pendingPayments"];
  q: PaymentsPageData["q"];
}) {
  if (pendingPayments.length > 0) {
    return (
      <section className="overflow-hidden rounded-3xl border border-amber-200 bg-card text-card-foreground shadow-sm dark:border-amber-800">
        <div className="border-b border-amber-100 bg-amber-50/80 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/30 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-amber-950 dark:text-amber-100">
                Payments awaiting verification
              </h2>
              <p className="mt-1 text-sm leading-6 text-amber-700 dark:text-amber-300">
                Verify only after confirming the transaction code, message, Paybill
                statement, bank statement, or cash receipt.
              </p>
            </div>

            <form action="/dashboard/org/payments" className="flex w-full max-w-md gap-2">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search transaction code"
                className={`${fieldClassName} h-10 min-w-0 flex-1 rounded-2xl py-2`}
              />
              <button type="submit" className={buttonPrimaryClassName}>
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/20 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Payer
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Method
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Target
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Reference
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Message
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Submitted
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.map((payment) => {
                const transactionMessage = getTransactionMessage(payment.callbackRaw);

                return (
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
                      {formatStatus(payment.method)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatStatus(payment.targetType)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {formatLedgerCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {payment.externalReference ??
                          payment.reference ??
                          payment.checkoutRequestId ??
                          "-"}
                      </span>
                    </td>
                    <td className="max-w-sm px-4 py-3 text-xs leading-5 text-muted-foreground">
                      {transactionMessage ? transactionMessage : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatLedgerDate(payment.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-64 flex-col gap-2">
                        <form action={verifyTenantPaymentAction}>
                          <input type="hidden" name="paymentId" value={payment.id} />
                          <input
                            type="text"
                            name="verificationNote"
                            required
                            minLength={5}
                            placeholder="How was it confirmed?"
                            className={`${compactFieldClassName} mb-2 border-emerald-200 focus:border-emerald-400 dark:border-emerald-800`}
                          />
                          <button
                            type="submit"
                            className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                          >
                            Verify & Allocate
                          </button>
                        </form>

                        <form
                          action={rejectTenantPaymentAction}
                          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                        >
                          <input type="hidden" name="paymentId" value={payment.id} />
                          <input
                            type="text"
                            name="reason"
                            placeholder="Optional rejection reason"
                            className={compactFieldClassName}
                          />
                          <button
                            type="submit"
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/30"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <section className={`${panelShellClassName} p-5 sm:p-6`}>
      <form action="/dashboard/org/payments" className="flex max-w-md gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search transaction code"
          className={`${fieldClassName} h-10 min-w-0 flex-1 rounded-2xl py-2`}
        />
        <button type="submit" className={buttonPrimaryClassName}>
          Search
        </button>
      </form>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {q
          ? "No pending payment matches that search."
          : "No payments are awaiting verification."}
      </p>
    </section>
  );
}