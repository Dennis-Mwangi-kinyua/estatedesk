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
    paymentInstructions,
  } = form;

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Smartphone className="h-4 w-4 text-slate-700" />
        <h2 className="text-sm font-semibold text-slate-900">
          Mobile Money Details
        </h2>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          Phone Number
        </span>
        <input
          type="tel"
          placeholder="e.g. 254712345678"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-blue-500"
        />
      </label>

      {method === "mpesa" ? (
        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            M-Pesa Transaction Code
          </span>
          <input
            type="text"
            required
            maxLength={10}
            placeholder="e.g. QAB12CD34E"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm uppercase outline-none transition focus:border-blue-500"
          />
        </label>
      ) : null}

      {method === "mpesa" && paymentInstructions?.mpesaEnabled ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">M-Pesa details</p>
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
    </div>
  );
}