"use client";

import { memo } from "react";
import { CurrencySelect } from "@/components/forms/currency-select";
import { STAFF_FORM_INPUT_CLASS } from "../_lib/helpers";
import type { FormValueChangeHandler, FormValues } from "../_lib/types";

export const StaffProfileFields = memo(function StaffProfileFields({
  values,
  requireAll = false,
  onChange,
}: {
  values: FormValues;
  requireAll?: boolean;
  onChange: FormValueChangeHandler;
}) {
  return (
    <section className="rounded-3xl border border-border bg-muted/15 p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">Staff profile</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {requireAll
            ? "Required HR details for the employee register and the staff member's own profile."
            : "Optional HR details for the employee register and the staff member's own profile."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Job title
          </label>
          <input
            name="jobTitle"
            value={values.jobTitle}
            onChange={(event) => onChange("jobTitle", event.target.value)}
            required={requireAll}
            placeholder="e.g. Senior caretaker"
            className={STAFF_FORM_INPUT_CLASS}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Education level
          </label>
          <select
            name="educationLevel"
            value={values.educationLevel}
            onChange={(event) => onChange("educationLevel", event.target.value)}
            required={requireAll}
            className={STAFF_FORM_INPUT_CLASS}
          >
            <option value="">{requireAll ? "Select education level" : "Not captured"}</option>
            <option value="Primary">Primary</option>
            <option value="Secondary">Secondary</option>
            <option value="Certificate">Certificate</option>
            <option value="Diploma">Diploma</option>
            <option value="Bachelor's degree">Bachelor&apos;s degree</option>
            <option value="Postgraduate">Postgraduate</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Salary
          </label>
          <input
            name="salaryAmount"
            type="number"
            min="0"
            step="0.01"
            value={values.salaryAmount}
            onChange={(event) => onChange("salaryAmount", event.target.value)}
            required={requireAll}
            placeholder="0.00"
            className={STAFF_FORM_INPUT_CLASS}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Currency
          </label>
          <CurrencySelect
            name="salaryCurrency"
            value={values.salaryCurrency}
            onChange={(event) =>
              onChange("salaryCurrency", event.target.value.toUpperCase())
            }
            required={requireAll}
            className={`${STAFF_FORM_INPUT_CLASS} uppercase`}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            National ID / employee ID
          </label>
          <input
            name="nationalId"
            value={values.nationalId}
            onChange={(event) => onChange("nationalId", event.target.value)}
            required={requireAll}
            placeholder={requireAll ? "Required" : "Optional"}
            className={STAFF_FORM_INPUT_CLASS}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Emergency contact
          </label>
          <input
            name="emergencyContact"
            value={values.emergencyContact}
            onChange={(event) =>
              onChange("emergencyContact", event.target.value)
            }
            required={requireAll}
            placeholder="Name and phone"
            className={STAFF_FORM_INPUT_CLASS}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Staff profile notes
          </label>
          <textarea
            name="staffProfileNotes"
            rows={3}
            value={values.staffProfileNotes}
            onChange={(event) =>
              onChange("staffProfileNotes", event.target.value)
            }
            required={requireAll}
            placeholder={requireAll ? "Required HR notes" : "Optional HR notes"}
            className={STAFF_FORM_INPUT_CLASS}
          />
        </div>
      </div>
    </section>
  );
});