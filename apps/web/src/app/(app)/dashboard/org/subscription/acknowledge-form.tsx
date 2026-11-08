"use client";
import { useActionState } from "react";
import { acknowledgePayment } from "./actions";
export function AcknowledgeForm({ invoiceId, paymentId }: { invoiceId: string; paymentId: string }) {
  const [state, action, pending] = useActionState(acknowledgePayment, {});
  return <form action={action} className="mt-3 space-y-2"><input type="hidden" name="invoiceId" value={invoiceId}/><input type="hidden" name="paymentId" value={paymentId}/><button disabled={pending} className="min-h-11 rounded-lg border px-4 text-sm font-semibold">{pending ? "Confirming…" : "I confirm this payment record is correct"}</button>{state.message ? <p role="status">{state.message}</p> : null}{state.error ? <p role="alert">{state.error}</p> : null}</form>;
}
