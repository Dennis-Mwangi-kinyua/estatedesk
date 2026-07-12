"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPropertyAction } from "@/features/properties/actions/create-property-action";
import { StepBilling } from "./_components/step-billing";
import { StepLandlord } from "./_components/step-landlord";
import { StepPropertyProfile } from "./_components/step-property-profile";
import { StepReview } from "./_components/step-review";
import { StepUnitMix } from "./_components/step-unit-mix";
import { WizardFormActions } from "./_components/wizard-form-actions";
import { WizardHeader } from "./_components/wizard-header";
import { WizardSidebar } from "./_components/wizard-sidebar";
import { WizardStepNav } from "./_components/wizard-step-nav";
import { buildReviewSummary } from "./_lib/build-review-summary";
import { STEPS } from "./_lib/constants";
import type {
  LandlordMode,
  PropertyCreateWizardProps,
  ReviewSummary,
} from "./_lib/types";
import { validateWizardStep } from "./_lib/validation";
import {
  alertErrorClassName,
  alertWarningClassName,
  panelShellClassName,
} from "./_lib/wizard-ui";

export function PropertyCreateWizard({
  orgName,
  currencyCode,
  errorMessage,
  taxpayerProfiles,
  landlordProfiles,
  helpOrgRole,
}: PropertyCreateWizardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [landlordMode, setLandlordMode] = useState<LandlordMode>("none");

  const taxpayerProfileMap = useMemo(() => {
    return new Map(
      taxpayerProfiles.map((profile) => [
        profile.id,
        `${profile.displayName} - ${profile.kraPin} (${profile.kind})`,
      ]),
    );
  }, [taxpayerProfiles]);

  const landlordProfileMap = useMemo(() => {
    return new Map(
      landlordProfiles.map((profile) => [
        profile.id,
        [
          profile.displayName,
          profile.phone,
          profile.email,
        ]
          .filter(Boolean)
          .join(" - "),
      ]),
    );
  }, [landlordProfiles]);

  function refreshReviewSummary() {
    const form = formRef.current;
    if (!form) return null;

    return buildReviewSummary(
      form,
      taxpayerProfileMap,
      landlordProfileMap,
      currencyCode,
    );
  }

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (currentStep !== STEPS.length) {
        setReviewConfirmed(false);
        return;
      }

      setReviewSummary(refreshReviewSummary());
      setReviewConfirmed(false);
    }, 0);
    return () => window.clearTimeout(id);
    // refreshReviewSummary is recreated each render; step + maps are the real deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, currencyCode, landlordProfileMap, taxpayerProfileMap]);

  function handleNext() {
    const form = formRef.current;
    if (!form) return;

    const validationError = validateWizardStep(currentStep, form);

    if (validationError) {
      setStepError(validationError);
      return;
    }

    setStepError(null);
    setCurrentStep((step) => Math.min(step + 1, STEPS.length));
  }

  function handleBack() {
    setStepError(null);
    setReviewConfirmed(false);
    setCurrentStep((step) => Math.max(step - 1, 1));
  }

  function handleConfirmReview() {
    const summary = refreshReviewSummary();
    if (!summary) {
      setStepError("Review summary could not be built. Try going back one step.");
      return;
    }

    setReviewSummary(summary);
    setReviewConfirmed(true);
    setStepError(null);
  }

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className={panelShellClassName}>
        <WizardHeader orgName={orgName} helpOrgRole={helpOrgRole} />

        <WizardStepNav currentStep={currentStep} />

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="px-5 py-6 sm:px-6">
            {errorMessage ? (
              <div className={`mb-6 ${alertErrorClassName}`}>{errorMessage}</div>
            ) : null}

            {stepError ? (
              <div className={`mb-6 ${alertWarningClassName}`}>{stepError}</div>
            ) : null}

            <form
              ref={formRef}
              action={createPropertyAction}
              noValidate
              className="space-y-8"
              onSubmit={(event) => {
                if (currentStep !== STEPS.length || !reviewConfirmed) {
                  event.preventDefault();
                }
              }}
            >
              <div className={currentStep === 1 ? "block" : "hidden"}>
                <StepPropertyProfile taxpayerProfiles={taxpayerProfiles} />
              </div>

              <div className={currentStep === 2 ? "block" : "hidden"}>
                <StepLandlord
                  landlordMode={landlordMode}
                  landlordProfiles={landlordProfiles}
                  onLandlordModeChange={setLandlordMode}
                />
              </div>

              <div className={currentStep === 3 ? "block" : "hidden"}>
                <StepBilling currencyCode={currencyCode} />
              </div>

              <div className={currentStep === 4 ? "block" : "hidden"}>
                <StepUnitMix currencyCode={currencyCode} />
              </div>

              <div className={currentStep === 5 ? "block" : "hidden"}>
                <StepReview
                  reviewSummary={reviewSummary}
                  reviewConfirmed={reviewConfirmed}
                />
              </div>

              <WizardFormActions
                currentStep={currentStep}
                reviewConfirmed={reviewConfirmed}
                onBack={handleBack}
                onNext={handleNext}
                onConfirmReview={handleConfirmReview}
              />
            </form>
          </div>

          <WizardSidebar />
        </div>
      </section>
    </div>
  );
}