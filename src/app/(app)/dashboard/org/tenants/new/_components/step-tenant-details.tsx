"use client";

import { inputClassName, stepPanelClassName, textareaClassName } from "../_lib/constants";
import { FieldLabel, SectionTitle } from "./ui-primitives";

export function StepTenantDetails({ isPending }: { isPending: boolean }) {
  return (
    <div className={stepPanelClassName}>
      <SectionTitle
        title="Tenant details"
        description="Capture the tenant’s identity and contact information."
      />

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <FieldLabel required>Full name</FieldLabel>
          <input
            name="fullName"
            type="text"
            maxLength={120}
            placeholder="Jane Wanjiku"
            autoComplete="name"
            enterKeyHint="next"
            className={inputClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <FieldLabel required>Phone</FieldLabel>
          <input
            name="phone"
            type="text"
            maxLength={30}
            placeholder="0712345678"
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
            className={inputClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <FieldLabel>Email</FieldLabel>
          <input
            name="email"
            type="email"
            maxLength={120}
            placeholder="tenant@example.com"
            autoComplete="email"
            enterKeyHint="next"
            className={inputClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <FieldLabel>National ID</FieldLabel>
          <input
            name="nationalId"
            type="text"
            maxLength={40}
            placeholder="Optional"
            enterKeyHint="next"
            className={inputClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <FieldLabel>KRA PIN</FieldLabel>
          <input
            name="kraPin"
            type="text"
            maxLength={40}
            placeholder="Optional"
            enterKeyHint="next"
            className={inputClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <FieldLabel>Status</FieldLabel>
          <select
            name="status"
            defaultValue="ACTIVE"
            className={inputClassName}
            disabled={isPending}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>
        </label>

        <label className="block md:col-span-2">
          <FieldLabel>Notes</FieldLabel>
          <textarea
            name="notes"
            rows={4}
            maxLength={1500}
            placeholder="Internal notes about this tenant"
            className={textareaClassName}
            disabled={isPending}
          />
        </label>
      </div>
    </div>
  );
}