"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { STAFF_ROLES, type StaffRole } from "@/features/staff/constants/role-meta";
import { BasicDetailsFields } from "./_components/basic-details-fields";
import { CaretakerDetailsStep } from "./_components/caretaker-details-step";
import { CaretakerHiddenFields } from "./_components/caretaker-hidden-fields";
import { CaretakerLoginStep } from "./_components/caretaker-login-step";
import { CaretakerReviewStep } from "./_components/caretaker-review-step";
import { CaretakerSetupStep } from "./_components/caretaker-setup-step";
import { FormError } from "./_components/form-error";
import { RoleSelect } from "./_components/role-select";
import { StandardCreationForm } from "./_components/standard-creation-form";
import { StaffProfileFields } from "./_components/staff-profile-fields";
import { StaffWizardStepper } from "./_components/staff-wizard-stepper";
import { SubmitButton } from "./_components/submit-button";

import {
  CARETAKER_STEPS,
  getInitialValues,
  INITIAL_ACTION_STATE,
} from "./_lib/helpers";
import type {
  AssignmentTarget,
  CreateAction,
  MemberFormProps,
  SimpleAction,
} from "./_lib/types";

import {
  isStaffCreationFormComplete,
  validateCaretakerStep,
} from "./_lib/validation";

export function MemberForm({
  action,
  defaultValues,
  submitLabel = "Save Member",
  lockedRole,
  assignmentTargets = [],
}: MemberFormProps) {
  const isEditing = Boolean(defaultValues);
  const initialRole = lockedRole ?? defaultValues?.role ?? STAFF_ROLES[0];

  const [actionState, formAction, isPending] = useActionState(
    action as CreateAction,
    INITIAL_ACTION_STATE,
  );

  const [selectedRole, setSelectedRole] = useState<StaffRole>(initialRole);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTarget, setSelectedTarget] =
    useState<AssignmentTarget | null>(null);
  const [localError, setLocalError] = useState<string | undefined>();

  const [values, setValues] = useState(() => getInitialValues(defaultValues));

  const isCaretakerCreation = !isEditing && selectedRole === "CARETAKER";

  useEffect(() => {
    if (
      actionState.ok ||
      typeof actionState.step !== "number" ||
      !isCaretakerCreation
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCurrentStep(actionState.step ?? 0);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [actionState.ok, actionState.step, isCaretakerCreation]);

  const assignmentPropertyId = useMemo(
    () => (selectedTarget?.type === "PROPERTY" ? selectedTarget.id : ""),
    [selectedTarget],
  );

  const assignmentBuildingId = useMemo(
    () => (selectedTarget?.type === "BUILDING" ? selectedTarget.id : ""),
    [selectedTarget],
  );

  const assignmentUnitId = "";

  const displayedError = localError ?? actionState.message;

  const isCreationFormComplete = useMemo(
    () => isStaffCreationFormComplete(values),
    [values],
  );

  const isCaretakerCreationComplete = useMemo(
    () =>
      isStaffCreationFormComplete(values, {
        requireCaretakerTarget: true,
        selectedTarget,
      }),
    [selectedTarget, values],
  );

  const isCaretakerStepComplete = useMemo(
    () => validateCaretakerStep(currentStep, values, selectedTarget) === null,
    [currentStep, selectedTarget, values],
  );

  const updateValue = useCallback(
    <K extends keyof typeof values>(key: K, value: (typeof values)[K]) => {
      setLocalError(undefined);
      setValues((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const handleRoleChange = useCallback((nextRole: StaffRole) => {
    setLocalError(undefined);
    setSelectedRole(nextRole);

    if (nextRole !== "CARETAKER") {
      setSelectedTarget(null);
      setCurrentStep(0);
    }
  }, []);

  const handleSelectTarget = useCallback((target: AssignmentTarget) => {
    setLocalError(undefined);
    setSelectedTarget(target);
  }, []);

  const clearSelectedTarget = useCallback(() => {
    setLocalError(undefined);
    setSelectedTarget(null);
  }, []);

  const goNext = useCallback(() => {
    const error = validateCaretakerStep(currentStep, values, selectedTarget);

    if (error) {
      setLocalError(error);
      return;
    }

    setLocalError(undefined);
    setCurrentStep((step) => Math.min(step + 1, CARETAKER_STEPS.length - 1));
  }, [currentStep, selectedTarget, values]);

  const goBack = useCallback(() => {
    setLocalError(undefined);
    setCurrentStep((step) => Math.max(step - 1, 0));
  }, []);

  if (isEditing) {
    return (
      <form action={action as SimpleAction} className="space-y-5">
        <BasicDetailsFields
          values={values}
          isEditing={isEditing}
          onChange={updateValue}
        />

        <StaffProfileFields values={values} onChange={updateValue} />

        {lockedRole ? (
          <input type="hidden" name="role" value={lockedRole} />
        ) : (
          <RoleSelect selectedRole={selectedRole} onChange={handleRoleChange} />
        )}

        <SubmitButton label={submitLabel} />
      </form>
    );
  }

  if (!isCaretakerCreation) {
    return (
      <StandardCreationForm
        formAction={formAction}
        displayedError={displayedError}
        lockedRole={lockedRole}
        selectedRole={selectedRole}
        onRoleChange={handleRoleChange}
        values={values}
        isEditing={isEditing}
        onChange={updateValue}
        isPending={isPending}
        submitLabel={submitLabel}
        isCreationFormComplete={isCreationFormComplete}
      />
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <CaretakerHiddenFields
        values={values}
        selectedRole={selectedRole}
        selectedTarget={selectedTarget}
        assignmentPropertyId={assignmentPropertyId}
        assignmentBuildingId={assignmentBuildingId}
        assignmentUnitId={assignmentUnitId}
      />

      <StaffWizardStepper currentStep={currentStep} />

      <FormError message={displayedError} />

      {currentStep === 0 ? (
        <CaretakerSetupStep
          values={values}
          selectedRole={selectedRole}
          lockedRole={lockedRole}
          availableTargets={assignmentTargets}
          selectedTarget={selectedTarget}
          continueDisabled={!isCaretakerStepComplete}
          onRoleChange={handleRoleChange}
          onSelectTarget={handleSelectTarget}
          onClearSelectedTarget={clearSelectedTarget}
          onChange={updateValue}
          onBack={goBack}
          onNext={goNext}
          currentStep={currentStep}
        />
      ) : null}

      {currentStep === 1 ? (
        <CaretakerDetailsStep
          values={values}
          isEditing={isEditing}
          continueDisabled={!isCaretakerStepComplete}
          onChange={updateValue}
          onBack={goBack}
          onNext={goNext}
          currentStep={currentStep}
        />
      ) : null}

      {currentStep === 2 ? (
        <CaretakerLoginStep
          values={values}
          continueDisabled={!isCaretakerStepComplete}
          onChange={updateValue}
          onBack={goBack}
          onNext={goNext}
          currentStep={currentStep}
        />
      ) : null}

      {currentStep === 3 ? (
        <CaretakerReviewStep
          values={values}
          selectedRole={selectedRole}
          selectedTarget={selectedTarget}
          currentStep={currentStep}
          submitLabel={isPending ? "Creating..." : submitLabel}
          submitDisabled={isPending || !isCaretakerCreationComplete}
          onBack={goBack}
          onNext={goNext}
        />
      ) : null}
    </form>
  );
}