"use client";

import { memo } from "react";

export const WizardButtons = memo(function WizardButtons({
  currentStep,
  isLastStep,
  submitLabel,
  continueDisabled = false,
  submitDisabled = false,
  onBack,
  onNext,
}: {
  currentStep: number;
  isLastStep: boolean;
  submitLabel?: string;
  continueDisabled?: boolean;
  submitDisabled?: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {currentStep > 0 ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-muted/30"
        >
          Back
        </button>
      ) : null}

      {isLastStep ? (
        <button
          type="submit"
          disabled={submitDisabled}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitLabel ?? "Create Caretaker"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={continueDisabled}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue
        </button>
      )}
    </div>
  );
});