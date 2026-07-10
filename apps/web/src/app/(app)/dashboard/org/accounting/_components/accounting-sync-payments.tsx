import { ArrowRightLeft } from "lucide-react";
import { syncPaymentsAction } from "../actions";
import { buttonPrimaryClassName, formatDate, formatMoney } from "../_lib/helpers";
import type { AccountingPageData } from "../_lib/types";
export function AccountingSyncPayments({ data }: { data: AccountingPageData }) {
  const { org, unpostedPayments, unpostedPaymentsCount } = data;

  return (
    <section className="rounded-2xl border border-border bg-muted/5">
      <div className="border-b border-border px-5 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          Payment ledger sync
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Verified tenant payments post as rental or water income with matching cash
          debits. Sync any collections not yet in the books.
        </p>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
          <p className="text-sm font-semibold text-foreground">
            {unpostedPaymentsCount === 0
              ? "Ledger is current"
              : `${unpostedPaymentsCount} verified payment${unpostedPaymentsCount === 1 ? "" : "s"} waiting to post`}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {unpostedPaymentsCount === 0
              ? "All verified payments already have matching journal entries."
              : "Run sync after verifying payments on the payments desk."}
          </p>
        </div>

        {unpostedPayments.length > 0 ? (
          <div className="space-y-2">
            {unpostedPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {payment.payerTenant?.fullName ?? "Tenant payment"} ·{" "}
                    {payment.targetType}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(payment.paidAt ?? payment.createdAt)} · {payment.method}
                  </p>
                </div>
                <span className="font-semibold text-foreground">
                  {formatMoney(Number(payment.amount), org.currencyCode)}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <form action={syncPaymentsAction}>
          <button
            type="submit"
            className={buttonPrimaryClassName}
            disabled={unpostedPaymentsCount === 0}
          >
            {unpostedPaymentsCount === 0
              ? "Payments synced"
              : `Post ${unpostedPaymentsCount} payment${unpostedPaymentsCount === 1 ? "" : "s"}`}
          </button>
        </form>
      </div>
    </section>
  );
}