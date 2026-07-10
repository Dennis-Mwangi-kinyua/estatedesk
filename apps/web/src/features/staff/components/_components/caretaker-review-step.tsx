"use client";

import { memo } from "react";
import type { StaffRole } from "@/features/staff/constants/role-meta";
import type { AssignmentTarget, FormValues } from "../_lib/types";
import { STAFF_PANEL_CLASS } from "../_lib/wizard-ui";
import { ReviewCard } from "./review-card";
import { SectionHeader } from "./section-header";
import { WizardButtons } from "./wizard-buttons";

export const CaretakerReviewStep = memo(function CaretakerReviewStep({
  values,
  selectedRole,
  selectedTarget,
  currentStep,
  submitLabel,
  submitDisabled,
  onBack,
  onNext,
}: {
  values: FormValues;
  selectedRole: StaffRole;
  selectedTarget: AssignmentTarget | null;
  currentStep: number;
  submitLabel: string;
  submitDisabled: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className={`${STAFF_PANEL_CLASS} p-5 sm:p-6`}>
      <SectionHeader
        title="Review and create"
        description="Confirm the assignment, profile, and login details before saving."
      />

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ReviewCard
          label="Assignment"
          value={selectedTarget?.label ?? "No mapping selected"}
        />
        <ReviewCard label="Role" value={selectedRole} />
        <ReviewCard label="Full name" value={values.fullName || "—"} />
        <ReviewCard label="Username" value={values.username || "—"} />
        <ReviewCard label="Email" value={values.email || "—"} />
        <ReviewCard label="Phone" value={values.phone || "—"} />
        <ReviewCard label="Job title" value={values.jobTitle || "—"} />
        <ReviewCard
          label="Salary"
          value={
            values.salaryAmount
              ? `${values.salaryCurrency || "KES"} ${values.salaryAmount}`
              : "Not captured"
          }
        />
        <ReviewCard
          label="Education"
          value={values.educationLevel || "Not captured"}
        />
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-muted/15 p-4">
        <p className="text-sm font-semibold text-foreground">
          Ready to create this caretaker
        </p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          A verified login will be created and the caretaker will be assigned to
          the selected scope immediately.
        </p>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <WizardButtons
          currentStep={currentStep}
          isLastStep
          submitLabel={submitLabel}
          submitDisabled={submitDisabled}
          onBack={onBack}
          onNext={onNext}
        />
      </div>
    </section>
  );
});