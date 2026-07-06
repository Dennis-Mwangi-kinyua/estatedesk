"use client";

import { STEPS } from "../_lib/constants";

export function WizardStepNav({ currentStep }: { currentStep: number }) {
  return (
    <div className="border-b border-border bg-muted/10 px-5 py-5 sm:px-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isComplete = currentStep > step.id;

          return (
            <div
              key={step.id}
              className={`rounded-2xl border px-4 py-4 transition ${
                isActive
                  ? "border-primary/40 bg-background shadow-sm"
                  : isComplete
                    ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                    : "border-border bg-background"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isComplete
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? "✓" : step.id}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}