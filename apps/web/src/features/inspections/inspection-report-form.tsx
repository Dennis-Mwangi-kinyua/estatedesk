"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeInspectionAction } from "./actions/complete-inspection-action";
import { inspectionChecklistFields } from "@/app/(app)/dashboard/caretaker/inspections/[inspectionId]/_lib/constants";

export function InspectionReportForm({ inspectionId }: { inspectionId: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const completed = Object.values(answers).filter(Boolean).length;
  const field = "min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground";
  if (submitted) return <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">Report submitted. Management can now review the inspection and confirm handover.</p>;
  return <form className="space-y-5" onSubmit={event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const files = Array.from(form.values()).filter((value): value is File => value instanceof File && value.size > 0);
    if (files.some(file => file.size > 2 * 1024 * 1024) || files.reduce((total, file) => total + file.size, 0) > 3 * 1024 * 1024) { setError("Use photos under 2MB each and 3MB in total."); return; }
    setError("");
    startTransition(async () => { try { await completeInspectionAction(form); setSubmitted(true); router.refresh(); } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not submit this report. Please try again."); } });
  }}>
    <input name="inspectionId" type="hidden" value={inspectionId} /><input name="streamlined" type="hidden" value="true" />
    <div><h3 className="text-base font-semibold">1. Record the condition</h3><p className="mt-1 text-xs text-muted-foreground">Choose Yes or No for every check. Add photos wherever evidence would help.</p><label className="mt-3 block text-xs">{completed} of {inspectionChecklistFields.length} checks answered<progress aria-label="Inspection checklist progress" max={inspectionChecklistFields.length} value={completed} className="mt-2 h-2 w-full accent-primary" /></label></div>
    <div className="grid gap-3 sm:grid-cols-2">{inspectionChecklistFields.map(item => <fieldset key={item.name} className="min-w-0 rounded-2xl border border-border p-3"><legend className="px-1 text-xs font-medium">{item.label}</legend><select aria-label={item.label} name={item.name} className={field} required value={answers[item.name] ?? ""} onChange={event => setAnswers(previous => ({ ...previous, [item.name]: event.target.value }))}><option value="">Choose result</option><option value="yes">Yes</option><option value="no">No</option></select><label className="mt-3 grid gap-1 text-xs text-muted-foreground">Supporting photo (optional)<input name={`photo_${item.name}`} type="file" accept="image/jpeg,image/png,image/webp" className="w-full min-w-0 text-xs" /></label></fieldset>)}</div>
    <div className="space-y-3"><h3 className="text-base font-semibold">2. Summarise findings</h3><label className="grid gap-1 text-xs">Inspection summary<textarea className={field} name="summary" required maxLength={2000} rows={4} placeholder="Overall condition, meter readings, and handover observations" /></label><label className="grid gap-1 text-xs">Damage and recommended repairs<textarea className={field} name="recommendations" required={answers.damageObserved === "yes"} maxLength={2000} rows={3} placeholder="Describe damage, location, and recommended follow-up. Required when damage is observed." /></label></div>
    <div className="space-y-3"><h3 className="text-base font-semibold">3. Submit for review</h3><p className="text-xs text-muted-foreground">The report goes to management and updates the tenant’s progress. The lease stays active until handover is confirmed.</p>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Submitting report…" : "Submit inspection report"}</button></div>
  </form>;
}
