"use client";
import { useEffect, useState, useTransition } from "react";
import { getSettlementPreview } from "../settlement-preview-action";
import { calculateSettlement, moneyCents } from "@/lib/move-outs/settlement";

export function CloseoutForm({ noticeId, deposit = "0", dateLimit, action }: { noticeId: string; deposit?: string; dateLimit: string; action: (form: FormData) => Promise<void> }) {
  const [held, setHeld] = useState(deposit);
  const [costs, setCosts] = useState<{ description: string; amount: string }[]>([]);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof getSettlementPreview>> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; getSettlementPreview(noticeId).then(value => { if (active) { setPreview(value); setHeld(value.depositHeld.toFixed(2)); } }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : "Could not load final balances."); }); return () => { active = false; }; }, [noticeId]);
  const [pending, startTransition] = useTransition();
  let refund = 0;
  let amountOwed = 0;
  let totalCosts = 0;
  let validAmounts = true;
  try { const result = calculateSettlement(moneyCents(held, "deposit"), moneyCents(preview?.outstandingBills ?? 0, "balance"), costs.map(cost => ({ description: cost.description, amount: moneyCents(cost.amount, "cost") / 100 }))); refund = result.refundDue; amountOwed = result.amountOwed; totalCosts = result.totalCosts; } catch { validAmounts = false; }
  const field = "w-full min-h-10 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground";
  return <form className="grid gap-3 rounded-2xl border border-border bg-muted/10 p-4" onSubmit={event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    startTransition(async () => { try { await action(form); window.location.assign("/dashboard/org/move-outs"); } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not close this move-out. Please try again."); } });
  }}>
    <input type="hidden" name="noticeId" value={noticeId} />
    <input type="hidden" name="costItems" value={JSON.stringify(costs)} />
    <input type="hidden" name="expectedOutstandingBills" value={preview?.outstandingBills ?? ""} />
    <h3 className="text-sm font-semibold">Confirm handover and settlement</h3>
    <p className="text-xs text-muted-foreground">Closing ends the lease and releases the unit. Record the agreed settlement in the organisation’s currency. This form records a refund; it does not send money.</p>
    <label className="grid gap-1 text-xs">Actual handover date<input className={field} name="actualMoveOutDate" type="date" max={dateLimit} required /></label>
    <label className="grid gap-1 text-xs">Deposit actually held<input className={field} name="depositHeld" readOnly type="number" min="0" max="9999999999.99" step="0.01" value={held} onChange={event => setHeld(event.target.value)} required /></label>
    <div className="space-y-2 text-xs"><h4 className="font-semibold">Outstanding bills</h4>{preview ? preview.lines.length ? preview.lines.map((line, index) => <p key={index}>{line.label}: {line.amount.toFixed(2)}</p>) : <p>No outstanding posted bills.</p> : <p role="status">Loading bill balances…</p>}</div>
    <div className="space-y-3"><h4 className="text-xs font-semibold">Damage, cleaning, and other agreed costs</h4><p className="text-xs text-muted-foreground">Use the inspection report and repair estimates. Existing bill balances are included above; do not enter them again.</p>{costs.map((cost, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]"><label className="grid gap-1 text-xs">Cost description<input className={field} value={cost.description} maxLength={200} required onChange={event => setCosts(previous => previous.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} /></label><label className="grid gap-1 text-xs">Amount<input className={field} type="number" min="0.01" max="9999999999.99" step="0.01" required value={cost.amount} onChange={event => setCosts(previous => previous.map((item, i) => i === index ? { ...item, amount: event.target.value } : item))} /></label><button type="button" className="self-end rounded-xl border border-border px-3 py-2 text-xs" aria-label={`Remove cost ${index + 1}`} onClick={() => setCosts(previous => previous.filter((_, i) => i !== index))}>Remove</button></div>)}<button type="button" disabled={costs.length >= 30} className="rounded-xl border border-border px-3 py-2 text-xs" onClick={() => setCosts(previous => [...previous, { description: "", amount: "" }])}>Add cost</button></div>
    <div className="space-y-1 text-sm font-medium" aria-live="polite"><p>Total bills and costs: {validAmounts ? totalCosts.toFixed(2) : "—"}</p><p>Refund due: {validAmounts ? refund.toFixed(2) : "—"}</p><p>Tenant still owes: {validAmounts ? amountOwed.toFixed(2) : "—"}</p></div>
    <label className="grid gap-1 text-xs">Refund status<select className={field} name="refundStatus" key={refund > 0 ? "due" : "none"} defaultValue={refund > 0 ? "PENDING" : "NOT_DUE"} required>{refund > 0 ? <><option value="PENDING">Refund pending</option></> : <option value="NOT_DUE">No refund due</option>}</select></label>
    <label className="grid gap-1 text-xs">Final balance and handover notes<textarea className={field} name="notes" rows={3} maxLength={2000} placeholder="Repair estimate references, agreed costs, refund reference if paid, and handover details" required /></label>
    <label className="flex items-start gap-2 text-xs"><input name="keysReturned" type="checkbox" required className="mt-0.5 size-4 shrink-0" />Keys have been returned and possession handed over.</label>
    <label className="flex items-start gap-2 text-xs"><input name="balancesReviewed" type="checkbox" required className="mt-0.5 size-4 shrink-0" />Final rent, water, other balances, and deposit have been reviewed.</label>
    <label className="flex gap-2 text-xs"><input type="checkbox" className="mt-0.5 size-4 shrink-0" name="finalBillingConfirmed" required />Final meter readings, utility bills, and rent adjustments have been posted and reviewed.</label>
    <a className="text-xs underline" href={`/api/move-outs/${noticeId}/report?costItems=${encodeURIComponent(JSON.stringify(costs))}`}>Generate report with these itemised costs</a>
    <label className="flex gap-2 text-xs"><input type="checkbox" className="mt-0.5 size-4 shrink-0" name="reportReviewed" required />I generated and reviewed the move-out report before handover.</label>
    <label className="flex gap-2 text-xs"><input type="checkbox" className="mt-0.5 size-4 shrink-0" name="unitReady" />Unit is ready to let. Otherwise it will remain under maintenance until released.</label>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <button type="submit" disabled={pending || !preview || !validAmounts} className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Closing move-out…" : "Confirm handover and close"}</button>
  </form>;
}
