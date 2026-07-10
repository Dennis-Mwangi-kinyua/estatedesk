import { BasicDetailsFields } from "./basic-details-fields";
import { FormError } from "./form-error";
import { LoginFields } from "./login-fields";
import { RoleSelect } from "./role-select";
import { StaffProfileFields } from "./staff-profile-fields";
import { SubmitButton } from "./submit-button";
import { VerifiedAccountNotice } from "./verified-account-notice";
import type { StaffRole } from "@/features/staff/constants/role-meta";
import type { FormValues } from "../_lib/types";
import { STAFF_PANEL_CLASS } from "../_lib/wizard-ui";

type StandardCreationFormProps = {
  formAction: (formData: FormData) => void;
  displayedError?: string;
  lockedRole?: StaffRole;
  selectedRole: StaffRole;
  onRoleChange: (role: StaffRole) => void;
  values: FormValues;
  isEditing: boolean;
  onChange: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
  isPending: boolean;
  submitLabel: string;
  isCreationFormComplete: boolean;
};

export function StandardCreationForm({
  formAction,
  displayedError,
  lockedRole,
  selectedRole,
  onRoleChange,
  values,
  isEditing,
  onChange,
  isPending,
  submitLabel,
  isCreationFormComplete,
}: StandardCreationFormProps) {
  return (
    <form action={formAction} className="space-y-5">
      <FormError message={displayedError} />

      <section className={`${STAFF_PANEL_CLASS} p-5 sm:p-6`}>
        {lockedRole ? (
          <input type="hidden" name="role" value={lockedRole} />
        ) : (
          <RoleSelect selectedRole={selectedRole} onChange={onRoleChange} />
        )}
      </section>

      <section className={`${STAFF_PANEL_CLASS} p-5 sm:p-6`}>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Profile details
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Personal contacts and HR records for the employee register.
        </p>
        <div className="mt-5 space-y-6">
          <BasicDetailsFields
            values={values}
            isEditing={isEditing}
            requirePhone
            onChange={onChange}
          />
          <StaffProfileFields values={values} requireAll onChange={onChange} />
        </div>
      </section>

      <section className={`${STAFF_PANEL_CLASS} p-5 sm:p-6`}>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Login credentials
        </h2>
        <div className="mt-5 space-y-4">
          <LoginFields values={values} onChange={onChange} />
          <VerifiedAccountNotice />
        </div>
      </section>

      <SubmitButton
        label={isPending ? "Saving..." : submitLabel}
        disabled={isPending || !isCreationFormComplete}
      />
    </form>
  );
}