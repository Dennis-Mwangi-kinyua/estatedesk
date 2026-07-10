"use client";

import { Building2 } from "lucide-react";
import type { CheckoutFormState } from "./use-checkout-form";

type KcbPaybillSectionProps = {
  form: CheckoutFormState;
};

export function KcbPaybillSection({ form }: KcbPaybillSectionProps) {
  const {
    phoneNumber,
    setPhoneNumber,
    transactionId,
    setTransactionId,
    proofMessage,
    setProofMessage,
    paymentInstructions,
  } = form;

  const instructions = paymentInstructions;

  return (
    <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-emerald-800" />
        <h2 className="text-sm font-semibold text-foreground">
          KCB Paybill Details
        </h2>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-foreground/80">
          Phone Number (M-Pesa)
        </span>
        <input
          type="tel"
          placeholder="e.g. 254712345678"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="h-12 w-full rounded-2xl border border-border bg-background text-foreground px-4 text-sm outline-none transition focus:border-emerald-600"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium text-foreground/80">
          M-Pesa Transaction Code
        </span>
        <input
          type="text"
          required
          maxLength={10}
          placeholder="e.g. QAB12CD34E"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="h-12 w-full rounded-2xl border border-border bg-background text-foreground px-4 text-sm uppercase outline-none transition focus:border-emerald-600"
        />
        <p className="mt-1.5 text-xs text-foreground/65">
          After paying via Lipa na M-Pesa to the KCB paybill, paste the 10-character
          confirmation code from the SMS.
        </p>
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium text-foreground/80">
          Paste M-Pesa message (optional)
        </span>
        <textarea
          rows={3}
          placeholder="Paste the full M-Pesa SMS for faster org verification"
          value={proofMessage}
          onChange={(e) => setProofMessage(e.target.value)}
          className="w-full resize-y rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-background text-foreground px-4 py-3 text-sm outline-none transition focus:border-emerald-600"
        />
      </label>

      {instructions &&
      (instructions.kcbPaybillEnabled ||
        (instructions.kcbPaybill && instructions.kcbAccountNumber)) ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4 text-sm text-emerald-950 dark:text-emerald-100">
          <p className="font-semibold">How to pay via KCB paybill</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-4 leading-6">
            <li>Open M-Pesa → Lipa na M-Pesa → Paybill</li>
            <li>
              Business number:{" "}
              <span className="font-semibold">{instructions.kcbPaybill}</span>
            </li>
            <li>
              Account number:{" "}
              <span className="font-semibold">{instructions.kcbAccountNumber}</span>
            </li>
            <li>Enter the amount due, then your M-Pesa PIN</li>
            <li>Submit the confirmation code above for org verification</li>
          </ol>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {instructions.kcbBusinessName ? (
              <p>
                Business:{" "}
                <span className="font-semibold">{instructions.kcbBusinessName}</span>
              </p>
            ) : null}
            {instructions.kcbAccountName ? (
              <p>
                Account name:{" "}
                <span className="font-semibold">{instructions.kcbAccountName}</span>
              </p>
            ) : null}
          </div>
          {instructions.kcbInstructions ? (
            <p className="mt-3 leading-6">{instructions.kcbInstructions}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
