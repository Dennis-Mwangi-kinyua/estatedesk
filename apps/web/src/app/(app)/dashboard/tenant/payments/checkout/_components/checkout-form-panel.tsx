"use client";

import { CreditCard } from "lucide-react";
import { formatSource } from "../_lib/helpers";
import { BankPaymentSection } from "./bank-payment-section";
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
    isBank,
    mpesaUnavailable,
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
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          <CreditCard className="h-4 w-4" />
          Checkout
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Complete your payment
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Confirm your payment details and continue.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment Method
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {methodLabel}
          </p>
        </div>

        {form.source === "advance_rent" && (
          <div className="grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-emerald-900">
                Amount
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 w-full rounded-lg border border-emerald-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-600"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-emerald-900">
                Months to cover
              </span>
              <input
                type="number"
                min="1"
                max="36"
                step="1"
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="h-12 w-full rounded-lg border border-emerald-200 bg-white px-4 text-sm outline-none transition focus:border-emerald-600"
              />
            </label>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Bill Type
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {formatSource(source)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Payment Reference
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {checkoutSummary?.friendlyReference ?? "Preparing reference"}
          </p>
          {checkoutSummary ? (
            <p className="mt-1 text-sm text-slate-500">
              {checkoutSummary.description} · {checkoutSummary.propertyName} / Unit{" "}
              {checkoutSummary.unitLabel}
            </p>
          ) : null}
        </div>

        {isMobileMoney ? <MobileMoneySection form={form} /> : null}
        {isBank ? <BankPaymentSection form={form} /> : null}

        {instructionsError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {instructionsError}
          </div>
        ) : null}

        {mpesaUnavailable || bankUnavailable ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            This payment method is not configured for your organization yet.
            Please contact your property manager.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Processing..." : "Continue to payment"}
        </button>
      </div>
    </section>
  );
}