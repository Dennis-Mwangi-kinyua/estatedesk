"use client";

import { memo } from "react";
import type { FormValueChangeHandler, FormValues } from "../_lib/types";
import { STAFF_PANEL_CLASS } from "../_lib/wizard-ui";
import { LoginFields } from "./login-fields";
import { SectionHeader } from "./section-header";
import { VerifiedAccountNotice } from "./verified-account-notice";
import { WizardButtons } from "./wizard-buttons";

export const CaretakerLoginStep = memo(function CaretakerLoginStep({
  values,
  currentStep,
  continueDisabled,
  onChange,
  onBack,
  onNext,
}: {
  values: FormValues;
  currentStep: number;
  continueDisabled: boolean;
  onChange: FormValueChangeHandler;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className={`${STAFF_PANEL_CLASS} p-5 sm:p-6`}>
      <SectionHeader
        title="Login credentials"
        description="Create the verified username and password this staff member will use to sign in."
      />

      <div className="mt-5 space-y-4">
        <LoginFields values={values} onChange={onChange} />
        <VerifiedAccountNotice />
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <WizardButtons
          currentStep={currentStep}
          isLastStep={false}
          continueDisabled={continueDisabled}
          onBack={onBack}
          onNext={onNext}
        />
      </div>
    </section>
  );
});