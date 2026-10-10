import { PaymentReviewSubmit } from "./payment-review-submit";
import {
  rejectTenantPaymentAction,
  verifyTenantPaymentAction,
} from "../actions";
import type { PaymentsPageData } from "../_lib/types";
import {
  buttonPrimaryClassName,
  fieldClassName,
  formatStatus,
  getTransactionMessage,
  panelShellClassName,
} from "./payments-ui";
import { getCheckoutMethodLabel } from "../_lib/helpers";
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

            <form action="/dashboard/org/payments" className="flex w-full max-w-md flex-col gap-2 min-[400px]:flex-row">
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search transaction code"
                className={`${fieldClassName} h-10 min-w-0 flex-1 rounded-2xl py-2`}
              />
              <button data-workspace-action="true" type="submit" className={buttonPrimaryClassName}>
                Search
              </button>
            </form>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 p-4 sm:p-6 xl:grid-cols-2">
          {pendingPayments.map(payment => {
            const raw = payment.callbackRaw;
            const proofUrl = raw && typeof raw === "object" && !Array.isArray(raw)
              && typeof raw.proofImageUrl === "string" && (raw.proofImageUrl.startsWith("https://imagedelivery.net/") || raw.proofImageUrl.startsWith("/uploads/payment-proof/"))
              ? raw.proofImageUrl : null;
            const message = getTransactionMessage(raw);
            const payer = payment.payerTenant?.fullName ?? payment.payerUser?.fullName ?? payment.payerName ?? payment.payerType;
            return <article key={payment.id} aria-label={`Review payment from ${payer}`} className="min-w-0 space-y-5 rounded-2xl border border-border bg-background p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><h3 className="break-words font-semibold">{payer}</h3><p className="mt-1 text-sm text-muted-foreground">{getCheckoutMethodLabel(payment.method, raw)} · {formatStatus(payment.targetType)}</p></div>
                <p className="text-xl font-bold">{formatLedgerCurrency(payment.amount)}</p>
              </div>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="min-w-0"><dt className="text-muted-foreground">Transaction reference</dt><dd className="mt-1 break-all font-semibold">{payment.externalReference ?? payment.reference ?? payment.checkoutRequestId ?? "Not supplied"}</dd></div>
                <div><dt className="text-muted-foreground">Submitted</dt><dd className="mt-1">{formatLedgerDate(payment.createdAt)}</dd></div>
              </dl>
              <section className="space-y-3 rounded-xl border border-border p-3" aria-label="Payment evidence">
                <h4 className="text-sm font-semibold">1. Review payment evidence</h4>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{message || "No confirmation message supplied."}</p>
                {proofUrl ? <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center rounded-xl border border-border px-4 text-sm font-semibold text-primary">Open receipt / screenshot</a> : <p className="text-xs text-muted-foreground">No screenshot supplied. Check the transaction against your payment statement.</p>}
              </section>
              <form action={verifyTenantPaymentAction} className="space-y-3">
                <input type="hidden" name="paymentId" value={payment.id} />
                <label className="grid gap-2 text-sm font-semibold">2. Record how you confirmed payment
                  <textarea name="verificationNote" required minLength={5} maxLength={2000} rows={3} placeholder="e.g. Matched the reference and amount on the M-Pesa statement" className={fieldClassName} />
                </label>
                <p className="text-xs leading-5 text-muted-foreground">Verification applies the payment to the bill and issues a receipt for the tenant and organisation.</p>
                <PaymentReviewSubmit />
              </form>
              <details className="rounded-xl border border-border p-3">
                <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium text-red-700 dark:text-red-200">Payment cannot be confirmed?</summary>
                <form action={rejectTenantPaymentAction} className="mt-3 space-y-3">
                  <input type="hidden" name="paymentId" value={payment.id} />
                  <label className="grid gap-2 text-sm">Rejection reason<textarea name="reason" rows={2} maxLength={2000} placeholder="Explain the issue to the tenant" className={fieldClassName} /></label>
                  <PaymentReviewSubmit reject />
                </form>
              </details>
            </article>;
          })}
        </div>
      </section>
    );
  }

  return (
    <section className={`${panelShellClassName} p-5 sm:p-6`}>
      <form action="/dashboard/org/payments" className="flex max-w-md flex-col gap-2 min-[400px]:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search transaction code"
          className={`${fieldClassName} h-10 min-w-0 flex-1 rounded-2xl py-2`}
        />
        <button data-workspace-action="true" type="submit" className={buttonPrimaryClassName}>
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
