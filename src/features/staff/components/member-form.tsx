"use client";

import {
  memo,
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { STAFF_ROLES, type StaffRole } from "@/features/staff/constants/role-meta";

type AssignmentTargetType = "PROPERTY" | "BUILDING" | "UNIT";

type AssignmentTarget = {
  id: string;
  type: AssignmentTargetType;
  label: string;
  searchText: string;
};

type CreateMembershipState = {
  ok: boolean;
  message?: string;
  step?: number;
  field?: string;
};

type CreateAction = (
  previousState: CreateMembershipState,
  formData: FormData,
) => Promise<CreateMembershipState>;

type SimpleAction = (formData: FormData) => void | Promise<void>;

type MemberFormProps = {
  action: CreateAction | SimpleAction;
  defaultValues?: {
    fullName?: string;
    username?: string;
    email?: string;
    phone?: string;
    role?: StaffRole;
  };
  submitLabel?: string;
  lockedRole?: StaffRole;
  assignmentTargets?: AssignmentTarget[];
};

type FormValues = {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  assignmentNotes: string;
  assignmentIsPrimary: boolean;
};

const CARETAKER_STEPS = ["Details", "Login", "Mapping", "Review"] as const;

const INITIAL_ACTION_STATE: CreateMembershipState = {
  ok: false,
};

function getInitialValues(
  defaultValues: MemberFormProps["defaultValues"],
): FormValues {
  return {
    fullName: defaultValues?.fullName ?? "",
    username: defaultValues?.username ?? "",
    email: defaultValues?.email ?? "",
    phone: defaultValues?.phone ?? "",
    password: "",
    confirmPassword: "",
    assignmentNotes: "",
    assignmentIsPrimary: true,
  };
}

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
  const [targetSearch, setTargetSearch] = useState("");
  const [selectedTarget, setSelectedTarget] =
    useState<AssignmentTarget | null>(null);
  const [localError, setLocalError] = useState<string | undefined>();

  const [values, setValues] = useState<FormValues>(() =>
    getInitialValues(defaultValues),
  );

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

  const filteredTargets = useMemo(() => {
    const query = targetSearch.trim().toLowerCase();

    if (!query) {
      return assignmentTargets.slice(0, 12);
    }

    return assignmentTargets
      .filter((target) => target.searchText.toLowerCase().includes(query))
      .slice(0, 12);
  }, [assignmentTargets, targetSearch]);

  const assignmentPropertyId = useMemo(
    () => (selectedTarget?.type === "PROPERTY" ? selectedTarget.id : ""),
    [selectedTarget],
  );

  const assignmentBuildingId = useMemo(
    () => (selectedTarget?.type === "BUILDING" ? selectedTarget.id : ""),
    [selectedTarget],
  );

  const assignmentUnitId = useMemo(
    () => (selectedTarget?.type === "UNIT" ? selectedTarget.id : ""),
    [selectedTarget],
  );

  const displayedError = localError ?? actionState.message;

  const updateValue = useCallback(
    <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
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
      setTargetSearch("");
      setCurrentStep(0);
    }
  }, []);

  const handleTargetSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setLocalError(undefined);
      setTargetSearch(event.target.value);
    },
    [],
  );

  const handleSelectTarget = useCallback((target: AssignmentTarget) => {
    setLocalError(undefined);
    setSelectedTarget(target);
  }, []);

  const clearSelectedTarget = useCallback(() => {
    setLocalError(undefined);
    setSelectedTarget(null);
  }, []);

  const validateStep = useCallback(
    (step: number) => {
      if (step === 0) {
        if (!values.fullName.trim()) {
          return "Full name is required.";
        }

        if (!values.username.trim()) {
          return "Username is required.";
        }

        if (!/^[a-z0-9._-]{3,30}$/.test(values.username.trim())) {
          return "Username must be 3-30 characters and can only contain letters, numbers, dots, underscores, and hyphens.";
        }

        if (!values.email.trim()) {
          return "Email is required.";
        }

        if (values.phone.trim() && values.phone.trim().length < 7) {
          return "Phone number looks too short.";
        }
      }

      if (step === 1) {
        if (values.password.length < 8) {
          return "Password must be at least 8 characters.";
        }

        if (values.password !== values.confirmPassword) {
          return "Passwords do not match.";
        }
      }

      if (step === 2 && !selectedTarget) {
        return "Please search and select a property, building, or apartment/unit for this caretaker.";
      }

      return null;
    },
    [selectedTarget, values],
  );

  const goNext = useCallback(() => {
    const error = validateStep(currentStep);

    if (error) {
      setLocalError(error);
      return;
    }

    setLocalError(undefined);
    setCurrentStep((step) => Math.min(step + 1, CARETAKER_STEPS.length - 1));
  }, [currentStep, validateStep]);

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

        {lockedRole ? (
          <>
            <input type="hidden" name="role" value={lockedRole} />
            <RoleDisplay role={lockedRole} />
          </>
        ) : (
          <RoleSelect selectedRole={selectedRole} onChange={handleRoleChange} />
        )}

        <SubmitButton label={submitLabel} />
      </form>
    );
  }

  if (!isCaretakerCreation) {
    return (
      <form action={formAction} className="space-y-5">
        <FormError message={displayedError} />

        <BasicDetailsFields
          values={values}
          isEditing={isEditing}
          onChange={updateValue}
        />

        <LoginFields values={values} onChange={updateValue} />

        {lockedRole ? (
          <>
            <input type="hidden" name="role" value={lockedRole} />
            <RoleDisplay role={lockedRole} />
          </>
        ) : (
          <RoleSelect selectedRole={selectedRole} onChange={handleRoleChange} />
        )}

        <VerifiedAccountNotice />

        <SubmitButton label={isPending ? "Saving..." : submitLabel} disabled={isPending} />
      </form>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="fullName" value={values.fullName} />
      <input type="hidden" name="username" value={values.username} />
      <input type="hidden" name="email" value={values.email} />
      <input type="hidden" name="phone" value={values.phone} />
      <input type="hidden" name="password" value={values.password} />
      <input type="hidden" name="confirmPassword" value={values.confirmPassword} />
      <input type="hidden" name="role" value={selectedRole} />

      <input
        type="hidden"
        name="assignmentTargetType"
        value={selectedTarget?.type ?? ""}
      />
      <input
        type="hidden"
        name="assignmentPropertyId"
        value={assignmentPropertyId}
      />
      <input
        type="hidden"
        name="assignmentBuildingId"
        value={assignmentBuildingId}
      />
      <input type="hidden" name="assignmentUnitId" value={assignmentUnitId} />
      <input
        type="hidden"
        name="assignmentNotes"
        value={values.assignmentNotes}
      />
      <input
        type="hidden"
        name="assignmentIsPrimary"
        value={values.assignmentIsPrimary ? "on" : ""}
      />

      <CaretakerStepIndicator currentStep={currentStep} />

      <FormError message={displayedError} />

      {currentStep === 0 ? (
        <section className="space-y-5">
          <SectionHeader
            title="Caretaker details"
            description="Enter the caretaker's personal and contact information."
          />

          <BasicDetailsFields
            values={values}
            isEditing={isEditing}
            onChange={updateValue}
          />

          <RoleDisplay role={selectedRole} />

          <WizardButtons
            currentStep={currentStep}
            isLastStep={false}
            onBack={goBack}
            onNext={goNext}
          />
        </section>
      ) : null}

      {currentStep === 1 ? (
        <section className="space-y-5">
          <SectionHeader
            title="Login credentials"
            description="Create the verified username and password this caretaker will use to log in."
          />

          <LoginFields values={values} onChange={updateValue} />

          <VerifiedAccountNotice />

          <WizardButtons
            currentStep={currentStep}
            isLastStep={false}
            onBack={goBack}
            onNext={goNext}
          />
        </section>
      ) : null}

      {currentStep === 2 ? (
        <CaretakerMappingStep
          values={values}
          targetSearch={targetSearch}
          selectedTarget={selectedTarget}
          filteredTargets={filteredTargets}
          onTargetSearchChange={handleTargetSearchChange}
          onSelectTarget={handleSelectTarget}
          onClearSelectedTarget={clearSelectedTarget}
          onChange={updateValue}
          onBack={goBack}
          onNext={goNext}
          currentStep={currentStep}
        />
      ) : null}

      {currentStep === 3 ? (
        <section className="space-y-5">
          <SectionHeader
            title="Review caretaker account"
            description="Confirm the details before creating the caretaker account."
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ReviewCard label="Full name" value={values.fullName || "—"} />
            <ReviewCard label="Username" value={values.username || "—"} />
            <ReviewCard label="Email" value={values.email || "—"} />
            <ReviewCard label="Phone" value={values.phone || "No phone"} />
            <ReviewCard label="Role" value={selectedRole} />
            <ReviewCard
              label="Mapping"
              value={selectedTarget?.label ?? "No mapping selected"}
            />
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              Check before submitting
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              The caretaker will be created with verified login credentials and
              assigned to the selected mapping.
            </p>
          </div>

          <WizardButtons
            currentStep={currentStep}
            isLastStep
            submitLabel={isPending ? "Creating..." : submitLabel}
            onBack={goBack}
            onNext={goNext}
          />
        </section>
      ) : null}
    </form>
  );
}

const FormError = memo(function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-900">Could not continue</p>
      <p className="mt-1 text-sm leading-6 text-red-700">{message}</p>
    </div>
  );
});

const SubmitButton = memo(function SubmitButton({
  label,
  disabled = false,
}: {
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {label}
    </button>
  );
});

const RoleSelect = memo(function RoleSelect({
  selectedRole,
  onChange,
}: {
  selectedRole: StaffRole;
  onChange: (role: StaffRole) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-800">
        Role
      </label>
      <select
        name="role"
        value={selectedRole}
        onChange={(event) => onChange(event.target.value as StaffRole)}
        className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
      >
        {STAFF_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </div>
  );
});

const BasicDetailsFields = memo(function BasicDetailsFields({
  values,
  isEditing,
  onChange,
}: {
  values: FormValues;
  isEditing: boolean;
  onChange: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) => void;
}) {
  return (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">
          Full Name
        </label>
        <input
          name="fullName"
          value={values.fullName}
          onChange={(event) => onChange("fullName", event.target.value)}
          required
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">
          Username
        </label>
        <input
          name="username"
          value={values.username}
          onChange={(event) => onChange("username", event.target.value)}
          required={!isEditing}
          minLength={3}
          maxLength={30}
          placeholder="e.g. john.caretaker"
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Use lowercase letters, numbers, dots, underscores, or hyphens.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">
          Email
        </label>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => onChange("email", event.target.value)}
          required={!isEditing}
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">
          Phone
        </label>
        <input
          name="phone"
          value={values.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="Optional phone number"
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
        />
        <p className="mt-1 text-xs text-neutral-500">
          Leave blank if this phone number is already used by another user.
        </p>
      </div>
    </>
  );
});

const LoginFields = memo(function LoginFields({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) => void;
}) {
  return (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">
          Password
        </label>
        <input
          name="password"
          type="password"
          value={values.password}
          onChange={(event) => onChange("password", event.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-800">
          Confirm Password
        </label>
        <input
          name="confirmPassword"
          type="password"
          value={values.confirmPassword}
          onChange={(event) => onChange("confirmPassword", event.target.value)}
          required
          minLength={8}
          placeholder="Repeat password"
          className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 outline-none transition focus:border-neutral-400"
        />
      </div>
    </>
  );
});

const RoleDisplay = memo(function RoleDisplay({ role }: { role: StaffRole }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-800">
        Role
      </label>
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-800">
        {role}
      </div>
    </div>
  );
});

const SectionHeader = memo(function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-neutral-600">{description}</p>
    </div>
  );
});

const CaretakerStepIndicator = memo(function CaretakerStepIndicator({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {CARETAKER_STEPS.map((step, index) => {
        const isActive = index === currentStep;
        const isDone = index < currentStep;

        return (
          <div
            key={step}
            className={`rounded-2xl border px-3 py-3 text-center text-xs font-semibold ${
              isActive
                ? "border-neutral-950 bg-neutral-950 text-white"
                : isDone
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-neutral-200 bg-neutral-50 text-neutral-500"
            }`}
          >
            {index + 1}. {step}
          </div>
        );
      })}
    </div>
  );
});

const CaretakerMappingStep = memo(function CaretakerMappingStep({
  values,
  targetSearch,
  selectedTarget,
  filteredTargets,
  currentStep,
  onTargetSearchChange,
  onSelectTarget,
  onClearSelectedTarget,
  onChange,
  onBack,
  onNext,
}: {
  values: FormValues;
  targetSearch: string;
  selectedTarget: AssignmentTarget | null;
  filteredTargets: AssignmentTarget[];
  currentStep: number;
  onTargetSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectTarget: (target: AssignmentTarget) => void;
  onClearSelectedTarget: () => void;
  onChange: <K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <section className="space-y-5">
      <SectionHeader
        title="Caretaker mapping"
        description="Search and select the property, building, or apartment/unit assigned to this caretaker."
      />

      <div className="space-y-4 rounded-3xl border border-sky-200 bg-sky-50 p-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-sky-950">
            Search property, building, or apartment/unit
          </label>
          <input
            type="search"
            value={targetSearch}
            onChange={onTargetSearchChange}
            placeholder="Search e.g. Block A, Unit 12, Westlands..."
            className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400"
          />
        </div>

        <div className="rounded-2xl border border-sky-200 bg-white p-3">
          {selectedTarget ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-500">
                  Selected mapping
                </p>
                <p className="mt-1 text-sm font-semibold text-sky-950">
                  {selectedTarget.label}
                </p>
              </div>

              <button
                type="button"
                onClick={onClearSelectedTarget}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-3 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
              >
                Change
              </button>
            </div>
          ) : (
            <p className="text-sm text-sky-800">
              No mapping selected yet. Search and click a result below.
            </p>
          )}
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-sky-200 bg-white p-2">
          {filteredTargets.length > 0 ? (
            filteredTargets.map((target) => {
              const isSelected =
                selectedTarget?.id === target.id &&
                selectedTarget?.type === target.type;

              return (
                <button
                  key={`${target.type}-${target.id}`}
                  type="button"
                  onClick={() => onSelectTarget(target)}
                  className={`flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${
                    isSelected
                      ? "border-sky-500 bg-sky-50 text-sky-950"
                      : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50"
                  }`}
                >
                  <span>
                    <span className="block font-medium">{target.label}</span>
                    <span className="mt-1 block text-xs uppercase tracking-[0.12em] text-slate-400">
                      {target.type}
                    </span>
                  </span>

                  {isSelected ? (
                    <span className="rounded-full bg-sky-600 px-2 py-1 text-xs font-semibold text-white">
                      Selected
                    </span>
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-sky-200 bg-sky-50 px-4 py-6 text-center">
              <p className="text-sm font-medium text-sky-950">
                No matching property, building, or unit found.
              </p>
              <p className="mt-1 text-sm text-sky-700">
                Try a different search term or create the property/unit first.
              </p>
            </div>
          )}
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-white p-4">
          <input
            type="checkbox"
            checked={values.assignmentIsPrimary}
            onChange={(event) =>
              onChange("assignmentIsPrimary", event.target.checked)
            }
            className="mt-1 h-4 w-4 rounded border-sky-300"
          />
          <div>
            <p className="text-sm font-medium text-sky-950">
              Primary assignment
            </p>
            <p className="text-sm leading-6 text-sky-800">
              Mark this as the caretaker&apos;s main responsibility.
            </p>
          </div>
        </label>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-sky-950">
            Assignment Notes
          </label>
          <textarea
            rows={3}
            value={values.assignmentNotes}
            onChange={(event) => onChange("assignmentNotes", event.target.value)}
            placeholder="Optional notes about this caretaker assignment"
            className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400"
          />
        </div>
      </div>

      <WizardButtons
        currentStep={currentStep}
        isLastStep={false}
        onBack={onBack}
        onNext={onNext}
      />
    </section>
  );
});

const WizardButtons = memo(function WizardButtons({
  currentStep,
  isLastStep,
  submitLabel,
  onBack,
  onNext,
}: {
  currentStep: number;
  isLastStep: boolean;
  submitLabel?: string;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {currentStep > 0 ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Back
        </button>
      ) : null}

      {isLastStep ? (
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          {submitLabel ?? "Create Caretaker"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Continue
        </button>
      )}
    </div>
  );
});

const ReviewCard = memo(function ReviewCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-neutral-950">
        {value}
      </p>
    </div>
  );
});

const VerifiedAccountNotice = memo(function VerifiedAccountNotice() {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-sm font-semibold text-emerald-900">
        Verified staff account
      </p>
      <p className="mt-1 text-sm leading-6 text-emerald-800">
        This staff member will be created with a verified username, verified
        email, secure password, and the selected staff role.
      </p>
    </div>
  );
});