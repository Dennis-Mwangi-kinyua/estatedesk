"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CheckoutFormPanel } from "./checkout-form-panel";
import { CheckoutSidebar } from "./checkout-sidebar";
import { useCheckoutForm } from "./use-checkout-form";

export function CheckoutWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useCheckoutForm({
    source: searchParams.get("source"),
    id: searchParams.get("id"),
    method: searchParams.get("method"),
    amountParam: searchParams.get("amount"),
    monthsParam: searchParams.get("months"),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <CheckoutFormPanel form={form} />
          <CheckoutSidebar form={form} />
        </div>
      </div>
    </div>
  );
}