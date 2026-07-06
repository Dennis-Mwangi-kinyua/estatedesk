"use client";

import { Landmark } from "lucide-react";
import type { CheckoutFormState } from "./use-checkout-form";

type BankPaymentSectionProps = {
  form: CheckoutFormState;
};

export function BankPaymentSection({ form }: BankPaymentSectionProps) {
  const {
    accountName,
    setAccountName,
    transactionId,
    setTransactionId,
    paymentInstructions,
  } = form;

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Landmark className="h-4 w-4 text-slate-700" />
        <h2 className="text-sm font-semibold text-slate-900">
          Bank Payment Details
        </h2>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          Account Name
        </span>
        <input
          type="text"
          placeholder="Enter account holder name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500"
        />
      </label>

      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          Bank Transaction ID
        </span>
        <input
          type="text"
          required
          placeholder="Enter the bank transfer reference"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm uppercase outline-none transition focus:border-blue-500"
        />
      </label>

      {paymentInstructions?.bankEnabled ? (
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <p className="font-semibold">Bank details</p>
          <div className="mt-3 grid gap-2">
            <p>
              Bank:{" "}
              <span className="font-semibold">
                {paymentInstructions.bankName}
              </span>
            </p>
            <p>
              Account name:{" "}
              <span className="font-semibold">
                {paymentInstructions.bankAccountName}
              </span>
            </p>
            <p>
              Account number:{" "}
              <span className="font-semibold">
                {paymentInstructions.bankAccountNumber}
              </span>
            </p>
            {paymentInstructions.bankBranch ? (
              <p>
                Branch:{" "}
                <span className="font-semibold">
                  {paymentInstructions.bankBranch}
                </span>
              </p>
            ) : null}
          </div>
          {paymentInstructions.bankInstructions ? (
            <p className="mt-3 leading-6">
              {paymentInstructions.bankInstructions}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}