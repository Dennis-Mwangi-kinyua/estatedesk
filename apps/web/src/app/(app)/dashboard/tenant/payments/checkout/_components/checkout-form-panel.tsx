"use client";

import { CreditCard } from "lucide-react";
import { formatSource } from "../_lib/helpers";
import { BankPaymentSection } from "./bank-payment-section";
import { KcbPaybillSection } from "./kcb-paybill-section";
import { MobileMoneySection } from "./mobile-money-section";
import type { CheckoutFormState } from "./use-checkout-form";

type CheckoutFormPanelProps = {
  form: CheckoutFormState;
};

export function CheckoutFormPanel({ form }: CheckoutFormPanelProps) {
  const {
    source,
    methodLabel,
    isMobileMoney,
    isKcbPaybill,
    isBank,
    methodUnavailable,
    mpesaUnavailable,
    kcbUnavailable,
    bankUnavailable,
    amount,
    setAmount,
    months,
    setMonths,
    checkoutSummary,
    instructionsError,
    error,
    isPending,
    handleSubmit,
    canSubmit,
  } = form;

  return (
    <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-100">
          <CreditCard className="h-4 w-4" />
          Checkout
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Complete your payment
        </h1>

        <p className="mt-2 text-sm text-foreground/75">
          Confirm your payment details and continue.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/65">
            Payment Method
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {methodLabel}
          </p>
        </div>

        {form.source === "advance_rent" && (
          <div className="grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-2 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-emerald-950 dark:text-emerald-100">
                Amount
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-emerald-950 dark:text-emerald-100">
                Months to cover
              </span>
              <input
                type="number"
                min="1"
                max="36"
                step="1"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
        )}

        {(form.source === "period_bill" ||
          form.source === "rent_charge" ||
          form.source === "water_bill") && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-500/30 dark:bg-sky-500/10">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-sky-950 dark:text-sky-100">
                Amount to pay
              </span>
              <p className="mb-2 text-xs text-sky-900/90 dark:text-sky-100/80">
                Pay the full balance or enter a smaller amount for a partial
                payment. Partials reduce rent first, then water.
              </p>
              <input
                type="number"
                min="1"
                step="1"
                max={checkoutSummary?.amount ?? undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
              {checkoutSummary?.amount != null ? (
                <p className="mt-2 text-xs font-medium text-sky-950 dark:text-sky-100">
                  Outstanding balance:{" "}
                  {new Intl.NumberFormat("en-KE", {
                    style: "currency",
                    currency: "KES",
                    maximumFractionDigits: 0,
                  }).format(checkoutSummary.amount)}
                </p>
              ) : null}
            </label>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/65">
            Bill Type
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {formatSource(source)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/65">
            Payment Reference
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {checkoutSummary?.friendlyReference ?? "Preparing reference"}
          </p>
          {checkoutSummary ? (
            <p className="mt-1 text-sm text-foreground/75">
              {checkoutSummary.description} · {checkoutSummary.propertyName} / Unit{" "}
              {checkoutSummary.unitLabel}
            </p>
          ) : null}
        </div>

        {isMobileMoney ? <MobileMoneySection form={form} /> : null}
        {isKcbPaybill ? <KcbPaybillSection form={form} /> : null}
        {isBank ? <BankPaymentSection form={form} /> : null}

        {instructionsError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            {instructionsError}
          </div>
        ) : null}

        {methodUnavailable || mpesaUnavailable || kcbUnavailable || bankUnavailable ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            This payment method is not configured for your organization yet.
            Please contact your property manager or choose another method.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "Processing..."
            : form.isGateway
              ? "Pay with STK Push"
              : "Submit for verification"}
        </button>
      </div>
    </section>
  );
}
