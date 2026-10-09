"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordCashPaymentAction } from "../_lib/record-payment-action";
import { fieldClassName, buttonPrimaryClassName, panelShellClassName } from "./payments-ui";

export function RecordCashPaymentForm({ leases, period, dateLimit }: { leases: { id: string; label: string }[]; period: string; dateLimit: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  return <details className={panelShellClassName}><summary className="cursor-pointer p-5 text-sm font-semibold">Record cash payment</summary><form className="grid gap-3 px-5 pb-5" onSubmit={event => {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    setError(""); setMessage("");
    startTransition(async () => { try { const result = await recordCashPaymentAction(form); element.reset(); setMessage(result.verified ? "Cash payment recorded, receipt issued, and bill balances updated." : "Cash payment recorded for manager/accountant review. Balances update after verification."); router.refresh(); } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not record payment."); } });
  }}>
    <p className="text-xs text-muted-foreground">Check submitted proof against the cash receipt. If the tenant already submitted this payment, verify that entry instead of creating another.</p>
    <label className="grid gap-1 text-xs">Tenant and unit<select name="leaseId" className={fieldClassName} required defaultValue=""><option value="" disabled>Choose tenant lease</option>{leases.map(lease => <option key={lease.id} value={lease.id}>{lease.label}</option>)}</select></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs">Amount received<input name="amount" type="number" min="0.01" max="9999999999.99" step="0.01" required className={fieldClassName} /></label><label className="grid gap-1 text-xs">Cash receipt number<input name="receiptReference" maxLength={100} required className={fieldClassName} /></label><label className="grid gap-1 text-xs">Payment date<input name="paidAt" type="date" max={dateLimit} defaultValue={dateLimit} required className={fieldClassName} /></label><label className="grid gap-1 text-xs">Billing month<input name="period" type="month" defaultValue={period} required className={fieldClassName} /></label></div>
    <label className="grid gap-1 text-xs">Receipt photo / submitted proof (optional, up to 2MB)<input name="proof" type="file" accept="image/jpeg,image/png,image/webp" /></label>
    <label className="grid gap-1 text-xs">Evidence and verification notes<textarea name="evidence" minLength={5} maxLength={2000} required rows={3} className={fieldClassName} placeholder="Who received cash, receipt details, and how the proof was checked" /></label>
    <label className="flex gap-2 text-xs"><input name="cashConfirmed" type="checkbox" required />I confirm the cash was received and the receipt details were checked.</label>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}{message ? <p role="status" className="text-sm">{message}</p> : null}
    <button type="submit" disabled={pending} className={`${buttonPrimaryClassName} disabled:opacity-60`}>{pending ? "Recording…" : "Record cash payment"}</button>
  </form></details>;
}
