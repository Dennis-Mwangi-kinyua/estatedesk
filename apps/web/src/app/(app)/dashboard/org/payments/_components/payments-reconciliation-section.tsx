import Link from "next/link";
import { formatLedgerCurrency, formatLedgerDate } from "@/lib/ledger";
import {
  disputePaymentReconciliationAction,
  importBankStatementAction,
  reconcilePaymentAction,
} from "../actions";
import type { PaymentsPageData } from "../_lib/types";
import {
  buttonPrimaryClassName,
  compactFieldClassName,
  formatStatus,
  panelShellClassName,
  reconciliationClasses,
  StatCard,
} from "./payments-ui";

export function PaymentsReconciliationSection({
  ledger,
  periodParams,
  unreconciledCount,
  disputedCount,
  reconciledThisMonth,
  pendingPayments,
  reconciliationQueue,
}: {
  ledger: PaymentsPageData["ledger"];
  periodParams: PaymentsPageData["periodParams"];
  unreconciledCount: PaymentsPageData["unreconciledCount"];
  disputedCount: PaymentsPageData["disputedCount"];
  reconciledThisMonth: PaymentsPageData["reconciledThisMonth"];
  pendingPayments: PaymentsPageData["pendingPayments"];
  reconciliationQueue: PaymentsPageData["reconciliationQueue"];
}) {
  return (
    <section className={`${panelShellClassName} space-y-4 p-5 sm:p-6`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Reconciliation channel
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">
            Statement matching and exceptions
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Match verified payments against M-Pesa, bank, or cash source records before
            relying on finance reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/api/org/reports/reconciliation?${periodParams.toString()}&status=UNRECONCILED`}
            className="inline-flex items-center justify-center rounded-2xl border border-amber-200 bg-background px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/30"
          >
            Unreconciled CSV
          </Link>
          <Link
            href={`/api/org/reports/reconciliation?${periodParams.toString()}&status=DISPUTED`}
            className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-background px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/30"
          >
            Disputed CSV
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Unreconciled"
          value={unreconciledCount}
          note="Verified payments to match"
          highlight={unreconciledCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Disputed"
          value={disputedCount}
          note="Needs finance review"
          highlight={disputedCount > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Reconciled this month"
          value={reconciledThisMonth}
          note={ledger.period}
          highlight={reconciledThisMonth > 0 ? "success" : "default"}
        />
        <StatCard
          label="Awaiting verification"
          value={pendingPayments.length}
          note="Before reconciliation"
        />
      </div>

      <form
        action={importBankStatementAction}
        className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-800 dark:bg-sky-950/20 sm:flex-row sm:items-end"
      >
        <label className="min-w-0 flex-1 text-sm font-medium text-sky-950 dark:text-sky-100">
          Bank statement CSV
          <span className="mt-1 block text-xs font-normal text-sky-700 dark:text-sky-300">
            Required columns: transactionId, amount, paidAt. Optional: payerName.
          </span>
          <input
            type="file"
            name="statement"
            required
            accept=".csv,text/csv"
            className="mt-2 min-h-11 w-full rounded-2xl border border-border bg-background p-2 text-sm text-foreground"
          />
        </label>
        <button className={`${buttonPrimaryClassName} min-h-11`}>
          Import and match
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/20 text-left">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Payer
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Amount
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Reference
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Recorded
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {reconciliationQueue.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-border/70 transition hover:bg-muted/10"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {payment.payerTenant?.fullName ??
                    payment.payerUser?.fullName ??
                    payment.payerName ??
                    payment.payerType}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatStatus(payment.method)} · {formatStatus(payment.targetType)}
                  </p>
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">
                  {formatLedgerCurrency(payment.amount)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {payment.externalReference ??
                    payment.reference ??
                    payment.checkoutRequestId ??
                    "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${reconciliationClasses(
                      payment.reconciliationStatus,
                    )}`}
                  >
                    {formatStatus(payment.reconciliationStatus)}
                  </span>
                  {payment.reconciliationNotes ? (
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                      {payment.reconciliationNotes}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatLedgerDate(payment.paidAt ?? payment.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="grid min-w-72 gap-2">
                    <form
                      action={reconcilePaymentAction}
                      className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <input
                        name="notes"
                        placeholder="Statement note"
                        className={compactFieldClassName}
                      />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                      >
                        Mark reconciled
                      </button>
                    </form>
                    <form
                      action={disputePaymentReconciliationAction}
                      className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <input
                        name="notes"
                        placeholder="Issue found"
                        className={compactFieldClassName}
                      />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-red-200 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/30"
                      >
                        Flag issue
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {reconciliationQueue.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No verified payments need reconciliation right now.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}