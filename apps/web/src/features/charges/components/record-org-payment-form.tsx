"use client";
import { useState } from "react";
import { ConfirmChargePaymentForm } from "./confirm-charge-payment-form";

export function RecordOrgPaymentForm({ options }: { options: { id: string; amount: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const [chargeId, setChargeId] = useState(options[0]?.id ?? "");
  const selected = options.find(option => option.id === chargeId);
  return <section aria-label="Record tenant payment" className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-6">
    <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="min-h-11 rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground">{open ? "Close payment entry" : "Record payment"}</button>
    {open ? <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Record money already received. Confirmation updates the balance and issues a receipt immediately. Overpayments become tenant credit.</p>
      {options.length ? <><label className="grid gap-2 text-sm">Tenant and bill<select className="min-h-11 min-w-0 rounded-xl border border-border bg-background px-3" value={chargeId} onChange={event => setChargeId(event.target.value)}>{options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
      {selected ? <ConfirmChargePaymentForm key={selected.id} chargeId={selected.id} amount={selected.amount} dateLimit={new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())} initiallyOpen /> : null}</> : <p className="text-sm">There are no outstanding charges to confirm. Create or review this tenant’s bills first.</p>}
    </div> : null}
  </section>;
}
