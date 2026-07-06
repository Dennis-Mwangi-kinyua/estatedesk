"use client";

import { memo } from "react";
import { CARETAKER_STEPS } from "../_lib/helpers";

export const StaffWizardStepper = memo(function StaffWizardStepper({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <nav aria-label="Staff setup progress" className="overflow-x-auto">
      <ol className="flex min-w-max gap-2">
        {CARETAKER_STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isDone = index < currentStep;

          return (
            <li
              key={step}
              className={`flex min-w-[8.5rem] flex-1 flex-col rounded-2xl border px-3 py-3 transition ${
                isActive
                  ? "border-primary/30 bg-primary/10"
                  : isDone
                    ? "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/30"
                    : "border-border bg-muted/10"
              }`}
            >
              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  isActive
                    ? "text-primary"
                    : isDone
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-muted-foreground"
                }`}
              >
                Step {index + 1}
              </span>
              <span
                className={`mt-1 text-sm font-semibold ${
                  isActive
                    ? "text-foreground"
                    : isDone
                      ? "text-emerald-800 dark:text-emerald-200"
                      : "text-muted-foreground"
                }`}
              >
                {step}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
});