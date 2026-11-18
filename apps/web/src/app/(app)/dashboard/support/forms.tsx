"use client";
import { useActionState } from "react";
import { createTicket, replyTicket } from "./actions";
const field = "mt-1 block w-full rounded-xl border border-border bg-background p-3 text-foreground";
export function SupportForm({ ticketId }: { ticketId?: string }) {
  const [state, action, pending] = useActionState(ticketId ? replyTicket : createTicket, {});
  return <form action={action} className="space-y-4">
    {ticketId ? <input type="hidden" name="ticketId" value={ticketId} /> : <>
      <label className="block">Subject<input name="subject" className={field} required minLength={3} maxLength={160} /></label>
      <label className="block">Category<select name="category" className={field}><option value="ACCOUNT">Account access</option><option value="BILLING">Billing</option><option value="TECHNICAL">Technical problem</option><option value="OTHER">Other</option></select></label>
    </>}
    <label className="block">{ticketId ? "Your reply" : "What do you need help with?"}<textarea name="body" className={field} rows={5} required minLength={ticketId ? 1 : 10} maxLength={4000} /></label>
    <p className="text-sm text-muted-foreground">Include the page name and what happened. Never include passwords, verification codes or payment PINs.</p>
    {state.error ? <p role="alert" className="text-red-600">{state.error}</p> : null}
    <button disabled={pending} className="min-h-11 rounded-xl bg-primary px-5 text-primary-foreground disabled:opacity-50">{pending ? "Sending…" : ticketId ? "Send reply" : "Submit request"}</button>
  </form>;
}
