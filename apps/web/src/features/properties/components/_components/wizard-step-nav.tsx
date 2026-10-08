"use client";
import { Check } from "lucide-react";
import { STEPS } from "../_lib/constants";
const stickers=["🏘️","🤝","💧","🚪","✨"];
export function WizardStepNav({ currentStep }: { currentStep: number }) {
  return <div className="border-b border-border bg-muted/10 px-4 py-4 sm:px-6">
    <ol aria-label="Property setup steps" className="grid grid-cols-5 gap-1 sm:gap-2">{STEPS.map(step=><li key={step.id} aria-current={currentStep===step.id?"step":undefined} className={`flex min-w-0 flex-col items-center gap-2 rounded-xl px-1 py-3 text-center ${currentStep===step.id?"bg-primary/5":""}`}>
      <span aria-hidden="true" className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl ${currentStep===step.id?"border-primary/30 bg-background ring-2 ring-primary/10":currentStep>step.id?"border-emerald-500/20 bg-emerald-500/10 text-emerald-600":"border-border bg-background"}`}>{currentStep>step.id?<Check className="h-5 w-5"/>:stickers[step.id-1]}</span>
      <span className="hidden text-xs font-medium text-muted-foreground sm:block">{step.title}</span><span className="text-[10px] font-semibold sm:hidden">{step.id}</span>
    </li>)}</ol>
    <div role="progressbar" aria-label="Property setup progress" aria-valuemin={1} aria-valuemax={5} aria-valuenow={currentStep} className="mt-3 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all motion-reduce:transition-none" style={{width:`${currentStep*20}%`}}/></div>
    <p className="mt-3 text-sm font-semibold">Step {currentStep} of 5 · {STEPS[currentStep-1].title}</p>
  </div>;
}
