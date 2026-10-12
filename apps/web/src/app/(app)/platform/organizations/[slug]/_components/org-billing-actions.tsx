"use client";

import { useActionState, useState } from "react";
import { Download, RefreshCw, Send, XCircle } from "lucide-react";
import { organizationBillingAction } from "../billing-actions";

export function OrgBillingActions({ orgId, cancelled }: { orgId: string; cancelled: boolean }) {
  const [operation, setOperation] = useState<"renew" | "invoice" | "cancel" | null>(null);
  const [state, action, pending] = useActionState(organizationBillingAction, {});
  const buttonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium disabled:opacity-50";
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => setOperation("renew")} className={`${buttonClass} bg-primary text-primary-foreground`}><RefreshCw aria-hidden="true" className="h-4 w-4" />Renew subscription</button>
        <button type="button" disabled={pending} onClick={() => setOperation("invoice")} className={buttonClass}><Send aria-hidden="true" className="h-4 w-4" />Send an invoice</button>
        <button type="button" disabled={pending || cancelled} onClick={() => setOperation("cancel")} className={`${buttonClass} text-red-600 dark:text-red-400`}><XCircle aria-hidden="true" className="h-4 w-4" />Cancel subscription</button>
      </div>
      {operation ? <form key={operation} action={action} className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
        <input type="hidden" name="orgId" value={orgId} />
        <input type="hidden" name="operation" value={operation} />
        {operation === "invoice" ? <div className="space-y-3"><p className="text-sm text-muted-foreground">Generate a PDF invoice with payment instructions to download and share.</p><label className="flex items-start gap-2 text-sm"><input type="checkbox" name="sendEmail" className="mt-1" />Also send by email to the billing contact (optional)</label></div> : <label className="flex items-start gap-2 text-sm"><input required type="checkbox" name="confirmed" className="mt-1" />{operation === "renew" ? "I have confirmed payment. Extend the subscription by 30 days from the current expiry, or today if expired." : "Cancel this subscription immediately. Organisation access will be affected."}</label>}
        <div className="flex flex-wrap gap-2">
          <button disabled={pending} className={`${buttonClass} bg-primary text-primary-foreground`} type="submit">{pending ? "Processing…" : operation === "invoice" ? "Generate invoice" : operation === "renew" ? "Confirm renewal" : "Confirm cancellation"}</button>
          <button disabled={pending} className={buttonClass} type="button" onClick={() => setOperation(null)}>Close</button>
        </div>
      </form> : null}
      {state.invoice ? <a className={buttonClass} href={`data:application/pdf;base64,${state.invoice.content}`} download={state.invoice.filename}><Download aria-hidden="true" className="h-4 w-4" />Download invoice PDF</a> : null}
      {state.error ? <p role="alert" className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      {state.success ? <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">{state.success}</p> : null}
    </div>
  );
}
