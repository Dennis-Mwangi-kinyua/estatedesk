"use client";

import { memo } from "react";
import type { FormValueChangeHandler, FormValues } from "../_lib/types";
import { STAFF_PANEL_CLASS } from "../_lib/wizard-ui";
import { BasicDetailsFields } from "./basic-details-fields";
import { SectionHeader } from "./section-header";
import { StaffProfileFields } from "./staff-profile-fields";
import { WizardButtons } from "./wizard-buttons";

export const CaretakerDetailsStep = memo(function CaretakerDetailsStep({
  values,
  isEditing,
  currentStep,
  continueDisabled,
  onChange,
  onBack,
  onNext,
}: {
  values: FormValues;
  isEditing: boolean;
  currentStep: number;
  continueDisabled: boolean;
  onChange: FormValueChangeHandler;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className={`${STAFF_PANEL_CLASS} p-5 sm:p-6`}>
      <SectionHeader
        title="Profile details"
        description="Capture personal contacts and HR records for the employee register."
      />

      <div className="mt-5 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Personal details</h3>
          <BasicDetailsFields
            values={values}
            isEditing={isEditing}
            requirePhone
            onChange={onChange}
          />
        </div>

        <div className="space-y-4 border-t border-border pt-6">
          <h3 className="text-sm font-semibold text-foreground">Staff profile</h3>
          <StaffProfileFields values={values} requireAll onChange={onChange} />
        </div>
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