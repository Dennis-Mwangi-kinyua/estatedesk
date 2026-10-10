"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, ReceiptText } from "lucide-react";
import { confirmChargePaymentAction } from "../confirm-charge-payment-action";

export function ConfirmChargePaymentForm({ chargeId, amount, dateLimit }: { chargeId: string; amount: string; dateLimit: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(amount);
  const [reference, setReference] = useState("");
  const [received, setReceived] = useState(false);
  const router = useRouter();
  const field = "min-h-11 w-full min-w-0 rounded-xl border border-border bg-background px-3 py-2 text-sm";
  const confirmation = receiptId ? <div className="space-y-2"><p role="status" className="text-sm">Payment confirmed. Receipt issued in both portals.</p><a href={`/api/receipts/${receiptId}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"><ReceiptText className="h-4 w-4" />Download receipt</a></div> : null;
  return <div className="space-y-3">
    {confirmation}
    <button type="button" onClick={() => { if (!open) setPaymentAmount(amount); setOpen(!open); setMessage(""); }} aria-expanded={open} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 px-4 py-2 text-sm font-semibold text-primary"><CircleCheck className="h-4 w-4" />{open ? "Cancel confirmation" : "Confirm paid"}</button>
    {open ? <form className="grid gap-3" action={form => {
      setMessage("");
      startTransition(async () => {
        try { const result = await confirmChargePaymentAction(form); if (result.status === "error") setMessage(result.message); else { setReceiptId(result.receiptId); setOpen(false); setReference(""); setReceived(false); router.refresh(); } }
        catch { setMessage("Could not confirm payment. Please try again."); }
      });
    }}>
      <input type="hidden" name="chargeId" value={chargeId} /><input type="hidden" name="expectedBalance" value={amount} />
      <p className="text-sm text-muted-foreground">Remaining balance: {Number(amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}. Enter the amount actually received.</p>
      <label className="grid gap-1 text-sm">Amount received<input name="amount" type="number" min="0.01" max={amount} step="0.01" required value={paymentAmount} onChange={event => setPaymentAmount(event.target.value)} className={field} /></label>
      <label className="grid gap-1 text-sm">Payment method<select name="paymentMethod" required defaultValue="CASH" className={field}><option value="CASH">Cash</option><option value="MPESA_MANUAL">M-Pesa</option><option value="BANK">Bank transfer</option></select></label>
      <label className="grid gap-1 text-sm">Payment reference / cash receipt number<input name="reference" required maxLength={100} value={reference} onChange={event => setReference(event.target.value)} className={field} /></label>
      <label className="grid gap-1 text-sm">Payment date<input name="paidAt" type="date" required max={dateLimit} defaultValue={dateLimit} className={field} /></label>
      <label className="flex items-start gap-2 text-sm"><input name="received" type="checkbox" required checked={received} onChange={event => setReceived(event.target.checked)} className="mt-1 h-4 w-4 shrink-0" />I confirm the money was received and the payment reference was checked.</label>
      {message ? <p role="alert" className="text-sm text-destructive">{message}</p> : null}
      <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Confirming…" : "Confirm payment and issue receipt"}</button>
    </form> : null}
  </div>;
}
