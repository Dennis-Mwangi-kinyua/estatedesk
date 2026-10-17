"use client";
import { useActionState } from "react";
import { organizationBillingAction } from "../../organizations/[slug]/billing-actions";
export function PaymentForm({orgId,invoiceId,paymentId,balance}:{orgId:string;invoiceId:string;paymentId:string;balance:number}) {
  const [state,action,pending] = useActionState(organizationBillingAction,{});
  return <form action={action} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
    <input type="hidden" name="orgId" value={orgId}/><input type="hidden" name="operation" value="payment"/><input type="hidden" name="invoiceId" value={invoiceId}/><input type="hidden" name="paymentId" value={paymentId}/>
    <label className="grid gap-1 text-sm">Amount received (KES)<input name="amount" type="number" min="0.01" max={balance} step="0.01" required className="min-h-11 rounded-lg border bg-background px-3"/></label>
    <label className="grid gap-1 text-sm">Payment reference<input name="paymentReference" required minLength={3} maxLength={120} className="min-h-11 rounded-lg border bg-background px-3"/></label>
    <label className="grid gap-1 text-sm">Payment date<input name="paidAt" type="date" required max={new Date().toISOString().slice(0,10)} className="min-h-11 rounded-lg border bg-background px-3"/></label>
    <label className="flex items-center gap-2 text-sm"><input name="confirmed" type="checkbox" required/>I have verified that this payment was received.</label>
    {state.error ? <p role="alert" className="text-sm text-red-600 sm:col-span-2">{state.error}</p> : null}{state.success ? <p role="status" className="text-sm sm:col-span-2">{state.success}</p> : null}
    <button disabled={pending} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">{pending ? "Recording…" : "Record payment"}</button>
  </form>;
}
