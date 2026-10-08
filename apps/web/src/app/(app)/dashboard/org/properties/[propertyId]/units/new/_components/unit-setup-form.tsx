"use client";

import { Children, cloneElement, isValidElement, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createUnitAction } from "../actions";

const steps = ["🏡 Identity", "📐 Layout", "💳 Pricing", "✅ Review"];
const button = "min-h-12 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-50";
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button data-workspace-action="true" type="submit" className={button} disabled={pending}>{pending ? "Creating unit…" : "Create unit"}</button>;
}

export function UnitSetupForm({ children, propertyName, cancelHref }: { children: ReactNode; propertyName: string; cancelHref: string }) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Array<[string, string]>>([]);
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  function move(next: number) {
    setStep(next);
    setError("");
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    });
  }
  function advance() {
    const controls = form.current?.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[data-unit-step="${step}"] input, [data-unit-step="${step}"] select, [data-unit-step="${step}"] textarea`);
    for (const control of controls ?? []) {
      if (!control.checkValidity()) { setError("Please complete the highlighted field before continuing."); control.reportValidity(); return; }
    }
    if (step === 3 && form.current) {
      const data = new FormData(form.current);
      const selectText = (name: string) => form.current?.querySelector<HTMLSelectElement>(`select[name="${name}"]`)?.selectedOptions[0]?.textContent ?? "";
      setSummary([["Property", propertyName], ["Unit number", String(data.get("houseNo") ?? "")], ["Building / block", selectText("buildingId")], ["Unit type", selectText("type")], ["Status", selectText("status")], ["Bedrooms", String(data.get("bedrooms") || "Not specified")], ["Bathrooms", String(data.get("bathrooms") || "Not specified")], ["Monthly rent", String(data.get("rentAmount") || "Not specified")], ["Deposit", String(data.get("depositAmount") || "Not specified")], ["Active", data.has("isActive") ? "Yes" : "No"]]);
    }
    move(step + 1);
  }
  return <form ref={form} action={createUnitAction} noValidate className="space-y-6" onSubmit={event => { if (step !== 4) { event.preventDefault(); advance(); } }}>
    <ol className="grid grid-cols-4 gap-2" aria-label="Unit setup steps">{steps.map((label, index) => <li key={label} aria-current={step === index + 1 ? "step" : undefined} className={`rounded-xl border p-2 text-center text-xs sm:text-sm ${step === index + 1 ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"}`}><span className="block sm:hidden" aria-hidden="true">{label.split(" ")[0]}</span><span className="hidden sm:block">{label}</span><span className="block sm:hidden">{index + 1}</span></li>)}</ol>
    <div role="progressbar" aria-label="Unit setup progress" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step} className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{width: `${step / 4 * 100}%`}} /></div>
    <h3 ref={heading} tabIndex={-1} className="text-lg font-semibold outline-none">Step {step} of 4 · {steps[step - 1]}</h3>
    {error && <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {Children.map(children, child => {
      if (!isValidElement<{ "data-unit-step"?: string; hidden?: boolean }>(child) || !child.props["data-unit-step"]) return child;
      return cloneElement(child, { hidden: Number(child.props["data-unit-step"]) !== step });
    })}
    {step === 4 && <div className="rounded-2xl border border-border p-4"><p className="mb-4 text-sm text-muted-foreground">Check the details before adding this rentable unit.</p><dl className="grid gap-4 sm:grid-cols-2">{summary.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="break-words font-medium">{value}</dd></div>)}</dl></div>}
    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">{step > 1 && <button data-workspace-action="true" type="button" onClick={() => move(step - 1)} className="min-h-12 rounded-xl border border-border px-5">Back</button>}{step < 4 ? <button data-workspace-action="true" type="button" onClick={advance} className={button}>{step === 3 ? "Review unit" : "Continue"}</button> : <SubmitButton />}<Link href={cancelHref} className="ml-auto py-3 text-sm text-muted-foreground">Cancel</Link></div>
  </form>;
}
