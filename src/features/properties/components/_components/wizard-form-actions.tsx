"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { STEPS } from "../_lib/constants";
import {
  buttonPrimaryClassName,
  buttonSecondaryClassName,
} from "../_lib/wizard-ui";

export function WizardFormActions({
  currentStep,
  reviewConfirmed,
  onBack,
  onNext,
  onConfirmReview,
}: {
  currentStep: number;
  reviewConfirmed: boolean;
  onBack: () => void;
  onNext: () => void;
  onConfirmReview: () => void;
}) {
  const isReviewStep = currentStep === STEPS.length;
  const nextLabel =
    currentStep === STEPS.length - 1 ? "Continue to review" : "Continue";

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        Step {currentStep} of {STEPS.length}
        {isReviewStep && !reviewConfirmed ? (
          <span className="mt-1 block text-amber-700 dark:text-amber-200">
            Review the summary below before creating the property.
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={onBack}
            className={buttonSecondaryClassName}
          >
            Back
          </button>
        ) : (
          <Link href="/dashboard/org/properties" className={buttonSecondaryClassName}>
            Cancel
          </Link>
        )}

        {!isReviewStep ? (
          <button type="button" onClick={onNext} className={buttonPrimaryClassName}>
            {nextLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : reviewConfirmed ? (
          <button type="submit" className={`gap-2 ${buttonPrimaryClassName}`}>
            <CheckCircle2 className="h-4 w-4" />
            Create property
          </button>
        ) : (
          <button
            type="button"
            onClick={onConfirmReview}
            className={`gap-2 ${buttonPrimaryClassName}`}
          >
            I have reviewed these details
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}