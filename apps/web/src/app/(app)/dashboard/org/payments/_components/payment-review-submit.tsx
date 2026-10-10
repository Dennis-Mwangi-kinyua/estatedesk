"use client";

import { useFormStatus } from "react-dom";

export function PaymentReviewSubmit({ reject = false }: { reject?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className={`inline-flex min-h-12 w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60 ${reject ? "border border-red-300 text-red-700 dark:text-red-200" : "bg-emerald-700 text-white hover:bg-emerald-800"}`}>
    {pending ? (reject ? "Rejecting…" : "Verifying…") : (reject ? "Reject payment" : "Verify payment & issue receipt")}
  </button>;
}
