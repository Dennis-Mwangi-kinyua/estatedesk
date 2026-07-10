import Link from "next/link";
import {
  formatLedgerCurrency,
  formatLedgerDate,
} from "@/lib/ledger";
import { paymentHealthTone } from "../_lib/helpers";
import type { getTenantProfileData } from "../_lib/queries";

type PaymentHealthBannerProps = {
  paymentHealth: NonNullable<
    Awaited<ReturnType<typeof getTenantProfileData>>["paymentHealth"]
  >;
};

export function PaymentHealthBanner({ paymentHealth }: PaymentHealthBannerProps) {
  const showPayNow =
    paymentHealth.tone !== "settled" && Number(paymentHealth.deficit ?? 0) > 0;

  return (
    <section
      className={`rounded-[26px] border p-4 shadow-sm sm:rounded-[28px] sm:p-5 ${paymentHealthTone(
        paymentHealth.tone,
      )}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] opacity-75">
            Payment health
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {paymentHealth.paymentStatus}
          </h2>
          <p className="mt-1 text-sm opacity-80">
            Balance {formatLedgerCurrency(paymentHealth.deficit)}
            {paymentHealth.oldestDueDate
              ? ` • oldest due ${formatLedgerDate(paymentHealth.oldestDueDate)}`
              : ""}
            {paymentHealth.daysPastDue > 0
              ? ` • ${paymentHealth.daysPastDue} days overdue`
              : ""}
          </p>
        </div>

        {showPayNow ? (
          <Link
            href="/dashboard/tenant/payments"
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Pay now
          </Link>
        ) : null}
      </div>
    </section>
  );
}