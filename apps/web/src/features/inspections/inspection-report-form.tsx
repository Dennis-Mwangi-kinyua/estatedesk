"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Check, ClipboardCheck, FileText, Send } from "lucide-react";
import { completeInspectionAction } from "./actions/complete-inspection-action";
import { inspectionChecklistFields } from "@/app/(app)/dashboard/caretaker/inspections/[inspectionId]/_lib/constants";

export function InspectionReportForm({ inspectionId }: { inspectionId: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const completed = Object.values(answers).filter(Boolean).length;
  const fieldClass = "min-h-12 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const files = Array.from(form.values()).filter((value): value is File => value instanceof File && value.size > 0);
    if (files.some(file => file.size > 2 * 1024 * 1024) || files.reduce((total, file) => total + file.size, 0) > 3 * 1024 * 1024) {
      setError("Use photos under 2MB each and keep the total below 3MB.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        await completeInspectionAction(form);
        setSubmitted(true);
        router.refresh();
      } catch (failure) {
        setError(failure instanceof Error ? failure.message : "Could not submit this report. Please try again.");
      }
    });
  }

  if (submitted) return <div role="status" className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm text-foreground sm:p-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-700"><Check aria-hidden="true" className="size-5" /></span><div><p className="font-semibold">Inspection report submitted</p><p className="mt-1 text-muted-foreground">Your part is complete. Management will review the findings, final bills, deposit, and key handover. The lease remains active until management records the move-out close-out.</p><Link href="/dashboard/caretaker/inspections" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted/30">Back to inspections</Link></div></div></div>;

  return (
    <form className="space-y-6 sm:space-y-8" onSubmit={submit}>
      <input name="inspectionId" type="hidden" value={inspectionId} />
      <input name="streamlined" type="hidden" value="true" />

      <section className="rounded-2xl border border-border bg-muted/10 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck aria-hidden="true" className="size-5" /></span><div><h3 className="text-base font-semibold text-foreground">Property condition checklist</h3><p className="mt-1 text-sm text-muted-foreground">Record each item. Add a photo where it helps explain the condition.</p></div></div>
          <div className="w-full shrink-0 sm:w-56"><div className="flex items-center justify-between text-xs font-medium"><span>Checklist progress</span><span>{completed} of {inspectionChecklistFields.length}</span></div><progress aria-label="Inspection checklist progress" max={inspectionChecklistFields.length} value={completed} className="mt-2 h-2 w-full accent-primary" /></div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {inspectionChecklistFields.map(item => (
            <fieldset key={item.name} className="min-w-0 rounded-2xl border border-border bg-card p-4">
              <legend className="max-w-full px-1 text-sm font-semibold leading-5 text-foreground">{item.label}</legend>
              <label className="mt-2 grid gap-1.5 text-xs font-medium text-muted-foreground">Condition
                <select aria-label={item.label} name={item.name} className={fieldClass} required value={answers[item.name] ?? ""} onChange={event => setAnswers(previous => ({ ...previous, [item.name]: event.target.value }))}>
                  <option value="">Choose a result</option><option value="yes">Yes</option><option value="no">No</option>
                </select>
              </label>
              <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"><Camera aria-hidden="true" className="size-4 shrink-0" /><span className="min-w-0 flex-1">Add supporting photo <span className="font-normal">(optional)</span></span><input name={`photo_${item.name}`} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" /></label>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border p-4 sm:p-5">
        <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><FileText aria-hidden="true" className="size-5" /></span><div><h3 className="text-base font-semibold text-foreground">Findings and follow-up</h3><p className="mt-1 text-sm text-muted-foreground">Write enough detail for the office to understand what needs attention.</p></div></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="grid content-start gap-2 text-sm font-medium text-foreground">Inspection summary<textarea className={`${fieldClass} min-h-32 resize-y`} name="summary" required maxLength={2000} rows={5} placeholder="Overall condition, meter readings, and handover observations" /></label>
          <label className="grid content-start gap-2 text-sm font-medium text-foreground">Damage and recommended repairs<textarea className={`${fieldClass} min-h-32 resize-y`} name="recommendations" required={answers.damageObserved === "yes"} maxLength={2000} rows={5} placeholder="Describe damage, its location, and recommended follow-up. Required when damage is observed." /><span className="text-xs font-normal text-muted-foreground">Required when damage has been observed.</span></label>
        </div>
      </section>

      <section className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-base font-semibold text-foreground">Submit for office review</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">The report is shared with management and updates the tenant’s move-out progress. The lease stays active until handover is confirmed.</p></div><button type="submit" disabled={pending} className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60 sm:w-auto"><Send aria-hidden="true" className="size-4" />{pending ? "Submitting report…" : "Submit inspection report"}</button></div>
        {error ? <p role="alert" className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm font-medium text-destructive">{error}</p> : null}
      </section>
    </form>
  );
}
