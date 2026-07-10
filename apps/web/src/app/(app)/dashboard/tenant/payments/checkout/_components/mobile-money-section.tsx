"use client";

import { Smartphone } from "lucide-react";
import type { CheckoutFormState } from "./use-checkout-form";

type MobileMoneySectionProps = {
  form: CheckoutFormState;
};

export function MobileMoneySection({ form }: MobileMoneySectionProps) {
  const {
    method,
    phoneNumber,
    setPhoneNumber,
    transactionId,
    setTransactionId,
    proofMessage,
    setProofMessage,
    paymentInstructions,
  } = form;

  const isMpesa =
    method === "mpesa" || method === "manual-mpesa" || method === "mpesa-stk";
  const isAirtel = method === "airtel-money";
  const isStk = method === "mpesa-stk";

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-foreground/80" />
        <h2 className="text-sm font-semibold text-foreground">
          {isStk
            ? "M-Pesa STK Push"
            : isAirtel
              ? "Airtel Money details"
              : "Manual M-Pesa details"}
        </h2>
      </div>

      {isStk ? (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          Enter your phone number and confirm. A prompt will open on your phone.
          When you complete payment, your bill balance updates automatically.
        </p>
      ) : (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Pay outside the app, then paste the code or SMS. Your organization will
          verify before the bill is reduced.
        </p>
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-foreground/80">
          Phone Number
        </span>
        <input
          type="tel"
          placeholder="e.g. 254712345678"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </label>

      {!isStk ? (
        <>
          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-foreground/80">
              {isAirtel
                ? "Airtel transaction reference"
                : "M-Pesa transaction code"}
            </span>
            <input
              type="text"
              required
              maxLength={isAirtel ? 20 : 10}
              placeholder={
                isAirtel ? "e.g. confirmation code" : "e.g. QAB12CD34E"
              }
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm uppercase text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-2 block text-sm font-medium text-foreground/80">
              Paste confirmation message (optional)
            </span>
            <textarea
              rows={3}
              placeholder="Paste the full SMS for faster org verification"
              value={proofMessage}
              onChange={(e) => setProofMessage(e.target.value)}
              className="w-full resize-y rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </>
      ) : null}

      {isMpesa && paymentInstructions ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          <p className="font-semibold">Pay to this M-Pesa</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {paymentInstructions.mpesaBusinessName ? (
              <p>
                Business:{" "}
                <span className="font-semibold">
                  {paymentInstructions.mpesaBusinessName}
                </span>
              </p>
            ) : null}
            {paymentInstructions.mpesaPaybill ? (
              <p>
                Paybill:{" "}
                <span className="font-semibold">
                  {paymentInstructions.mpesaPaybill}
                </span>
              </p>
            ) : null}
            {paymentInstructions.mpesaTillNumber ? (
              <p>
                Till:{" "}
                <span className="font-semibold">
                  {paymentInstructions.mpesaTillNumber}
                </span>
              </p>
            ) : null}
            {paymentInstructions.mpesaAccountNumber ? (
              <p>
                Account:{" "}
                <span className="font-semibold">
                  {paymentInstructions.mpesaAccountNumber}
                </span>
              </p>
            ) : null}
          </div>
          {paymentInstructions.mpesaInstructions ? (
            <p className="mt-3 leading-6">
              {paymentInstructions.mpesaInstructions}
            </p>
          ) : null}
        </div>
      ) : null}

      {isAirtel && paymentInstructions ? (
        <div className="mt-4 rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 text-sm text-rose-950 dark:text-rose-100">
          <p className="font-semibold">Pay to this Airtel Money</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {paymentInstructions.airtelBusinessName ? (
              <p>
                Name:{" "}
                <span className="font-semibold">
                  {paymentInstructions.airtelBusinessName}
                </span>
              </p>
            ) : null}
            {paymentInstructions.airtelNumber ? (
              <p>
                Number:{" "}
                <span className="font-semibold">
                  {paymentInstructions.airtelNumber}
                </span>
              </p>
            ) : null}
          </div>
          {paymentInstructions.airtelInstructions ? (
            <p className="mt-3 leading-6">
              {paymentInstructions.airtelInstructions}
            </p>
          ) : (
            <p className="mt-3 leading-6">
              Send the amount via Airtel Money, then enter the confirmation code
              above and submit for organization verification.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
