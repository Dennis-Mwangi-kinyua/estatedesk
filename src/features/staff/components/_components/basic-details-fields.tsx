"use client";

import { memo } from "react";
import { STAFF_FORM_INPUT_CLASS } from "../_lib/helpers";
import type { FormValueChangeHandler, FormValues } from "../_lib/types";

export const BasicDetailsFields = memo(function BasicDetailsFields({
  values,
  isEditing,
  requirePhone = false,
  onChange,
}: {
  values: FormValues;
  isEditing: boolean;
  requirePhone?: boolean;
  onChange: FormValueChangeHandler;
}) {
  return (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Full Name
        </label>
        <input
          name="fullName"
          value={values.fullName}
          onChange={(event) => onChange("fullName", event.target.value)}
          required
          className={STAFF_FORM_INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
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
          className={STAFF_FORM_INPUT_CLASS}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Use lowercase letters, numbers, dots, underscores, or hyphens.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Email
        </label>
        <input
          name="email"
          type="email"
          value={values.email}
          onChange={(event) => onChange("email", event.target.value)}
          required={!isEditing}
          className={STAFF_FORM_INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Phone
        </label>
        <input
          name="phone"
          value={values.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          required={requirePhone}
          minLength={requirePhone ? 7 : undefined}
          placeholder={requirePhone ? "e.g. +254712345678" : "Optional phone number"}
          className={STAFF_FORM_INPUT_CLASS}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {requirePhone
            ? "Required contact number for the staff member."
            : "Leave blank if this phone number is already used by another user."}
        </p>
      </div>
    </>
  );
});