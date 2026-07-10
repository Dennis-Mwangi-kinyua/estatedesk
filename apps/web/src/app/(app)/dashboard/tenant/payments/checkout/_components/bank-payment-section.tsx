"use client";

import { Landmark } from "lucide-react";
import { getBankAccountForMethod } from "@/lib/payments/instructions";
import { getPaymentMethodDefinition } from "@/lib/payments/methods-catalog";
import type { CheckoutFormState } from "./use-checkout-form";

type BankPaymentSectionProps = {
  form: CheckoutFormState;
};

export function BankPaymentSection({ form }: BankPaymentSectionProps) {
  const {
    method,
    accountName,
    setAccountName,
    transactionId,
    setTransactionId,
    proofMessage,
    setProofMessage,
    paymentInstructions,
  } = form;

  const methodDef = method ? getPaymentMethodDefinition(method) : null;
  const bankAccount =
    method && paymentInstructions
      ? getBankAccountForMethod(paymentInstructions, method)
      : null;
  const bankLabel =
    bankAccount?.businessName ||
    methodDef?.name ||
    paymentInstructions?.bankName ||
    "Bank";

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Landmark className="h-4 w-4 text-foreground/80" />
        <h2 className="text-sm font-semibold text-foreground">
          {bankLabel} payment details
        </h2>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-foreground/80">
          Your account / sender name
        </span>
        <input
          type="text"
          placeholder="Name used on the transfer"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          className="h-12 w-full rounded-2xl border border-border bg-background text-foreground px-4 text-sm outline-none transition focus:border-blue-500"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium text-foreground/80">
          Bank Transaction ID
        </span>
        <input
          type="text"
          required
          placeholder="Enter the bank transfer reference"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="h-12 w-full rounded-2xl border border-border bg-background text-foreground px-4 text-sm uppercase outline-none transition focus:border-blue-500"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium text-foreground/80">
          Paste bank confirmation (optional)
        </span>
        <textarea
          rows={3}
          placeholder="Paste the bank SMS or transfer confirmation for faster verification"
          value={proofMessage}
          onChange={(e) => setProofMessage(e.target.value)}
          className="w-full resize-y rounded-2xl border border-border bg-background text-foreground px-4 py-3 text-sm outline-none transition focus:border-blue-500"
        />
      </label>

      {bankAccount ? (
        <div className="mt-4 rounded-2xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 p-4 text-sm text-sky-950 dark:text-sky-100">
          <p className="font-semibold">Pay to {bankLabel}</p>
          <div className="mt-3 grid gap-2">
            <p>
              Account name:{" "}
              <span className="font-semibold">{bankAccount.accountName}</span>
            </p>
            <p>
              Account number:{" "}
              <span className="font-semibold">{bankAccount.accountNumber}</span>
            </p>
            {bankAccount.branch ? (
              <p>
                Branch:{" "}
                <span className="font-semibold">{bankAccount.branch}</span>
              </p>
            ) : null}
          </div>
          {bankAccount.instructions ? (
            <p className="mt-3 leading-6">{bankAccount.instructions}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
