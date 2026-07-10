"use client";

import { ShieldCheck } from "lucide-react";
import { formatSource } from "../_lib/helpers";
import type { CheckoutFormState } from "./use-checkout-form";

type CheckoutSidebarProps = {
  form: CheckoutFormState;
};

export function CheckoutSidebar({ form }: CheckoutSidebarProps) {
  const { source, method, methodLabel, isBank, paymentInstructions } = form;

  return (
    <aside className="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-border">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-emerald-600" />
        <h2 className="text-lg font-semibold text-foreground">Secure Payment</h2>
      </div>

      <div className="mt-4 space-y-4 text-sm text-foreground/75">
        <div className="rounded-2xl bg-background p-4">
          <p className="font-medium text-foreground">Selected Method</p>
          <p className="mt-1">{methodLabel}</p>
        </div>

        <div className="rounded-2xl bg-background p-4">
          <p className="font-medium text-foreground">Bill Source</p>
          <p className="mt-1">{formatSource(source)}</p>
        </div>

        <div className="rounded-2xl bg-background p-4">
          <p className="font-medium text-foreground">How it works</p>
          {method === "mpesa" && paymentInstructions?.mpesaEnabled ? (
            <p className="mt-1">
              Pay using this organization&apos;s M-Pesa details, then continue so
              EstateDesk can record the payment for review.
            </p>
          ) : isBank && paymentInstructions?.bankEnabled ? (
            <p className="mt-1">
              Transfer to this organization&apos;s bank account and enter the
              account name or reference used for the payment.
            </p>
          ) : (
            <p className="mt-1">
              After confirmation, the system starts the selected payment flow for
              this organization.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}