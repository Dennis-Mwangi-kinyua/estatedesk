"use client";

import { memo } from "react";
import type { StaffRole } from "@/features/staff/constants/role-meta";
import { ROLE_META } from "@/features/staff/constants/role-meta";
import type {
  AssignmentTarget,
  FormValueChangeHandler,
  FormValues,
} from "../_lib/types";
import { STAFF_MUTED_PANEL_CLASS, STAFF_PANEL_CLASS } from "../_lib/wizard-ui";
import { AssignmentTargetPicker } from "./assignment-target-picker";
import { RoleSelect } from "./role-select";
import { SectionHeader } from "./section-header";
import { WizardButtons } from "./wizard-buttons";

export const CaretakerSetupStep = memo(function CaretakerSetupStep({
  values,
  selectedRole,
  lockedRole,
  availableTargets,
  selectedTarget,
  currentStep,
  continueDisabled,
  onRoleChange,
  onSelectTarget,
  onClearSelectedTarget,
  onChange,
  onBack,
  onNext,
}: {
  values: FormValues;
  selectedRole: StaffRole;
  lockedRole?: StaffRole;
  availableTargets: AssignmentTarget[];
  selectedTarget: AssignmentTarget | null;
  currentStep: number;
  continueDisabled: boolean;
  onRoleChange: (role: StaffRole) => void;
  onSelectTarget: (target: AssignmentTarget) => void;
  onClearSelectedTarget: () => void;
  onChange: FormValueChangeHandler;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className={`${STAFF_PANEL_CLASS} p-5 sm:p-6`}>
      <SectionHeader
        title="Who are you creating?"
        description="Choose the staff role and, for caretakers, where they will work before entering profile details."
      />

      <div className="mt-5 space-y-5">
        {lockedRole ? (
          <div className={`${STAFF_MUTED_PANEL_CLASS} px-4 py-4`}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Staff role
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {ROLE_META[lockedRole].label}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {ROLE_META[lockedRole].description}
            </p>
          </div>
        ) : (
          <RoleSelect selectedRole={selectedRole} onChange={onRoleChange} />
        )}

        <div className="border-t border-border pt-5">
          <SectionHeader
            title="Caretaker assignment"
            description="Select the property or apartment/block this caretaker will manage."
          />

          <div className="mt-4">
            <AssignmentTargetPicker
              availableTargets={availableTargets}
              selectedTarget={selectedTarget}
              onSelectTarget={onSelectTarget}
              onClearSelectedTarget={onClearSelectedTarget}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/10 p-4">
              <input
                type="checkbox"
                checked={values.assignmentIsPrimary}
                onChange={(event) =>
                  onChange("assignmentIsPrimary", event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-border"
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Primary assignment
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Mark this as the caretaker&apos;s main responsibility.
                </p>
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Assignment notes
              </span>
              <textarea
                rows={3}
                value={values.assignmentNotes}
                onChange={(event) =>
                  onChange("assignmentNotes", event.target.value)
                }
                placeholder="Optional notes about this assignment"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
              />
            </label>
          </div>
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