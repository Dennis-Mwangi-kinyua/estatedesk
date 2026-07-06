"use client";

import { memo } from "react";
import { STAFF_FORM_INPUT_CLASS } from "../_lib/helpers";
import type { FormValueChangeHandler, FormValues } from "../_lib/types";

export const LoginFields = memo(function LoginFields({
  values,
  onChange,
}: {
  values: FormValues;
  onChange: FormValueChangeHandler;
}) {
  return (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
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
          className={STAFF_FORM_INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
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
          className={STAFF_FORM_INPUT_CLASS}
        />
      </div>
    </>
  );
});