"use client";

import type { LandlordMode, LandlordProfileOption } from "../_lib/types";
import {
  calloutInfoClassName,
  fieldClassName,
  labelClassName,
  stepDescriptionClassName,
  stepTitleClassName,
  textareaClassName,
} from "../_lib/wizard-ui";

const LANDLORD_OPTIONS = [
  {
    value: "none",
    title: "No landlord",
    description: "Create the property without owner access.",
  },
  {
    value: "existing",
    title: "Existing landlord",
    description: "Attach this property to a landlord profile.",
  },
  {
    value: "new",
    title: "New landlord",
    description: "Create login credentials and link ownership.",
  },
] as const;

export function StepLandlord({
  landlordMode,
  landlordProfiles,
  onLandlordModeChange,
}: {
  landlordMode: LandlordMode;
  landlordProfiles: LandlordProfileOption[];
  onLandlordModeChange: (mode: LandlordMode) => void;
}) {
  return (
    <section className="block">
      <div className="space-y-5">
        <div>
          <h2 className={stepTitleClassName}>Landlord ownership</h2>
          <p className={stepDescriptionClassName}>
            Link this property to an existing landlord or create a new landlord
            account with exclusive property-scoped access.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {LANDLORD_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`block rounded-2xl border p-4 transition ${
                landlordMode === option.value
                  ? "border-primary/40 bg-muted/20"
                  : "border-border bg-background"
              }`}
            >
              <input
                type="radio"
                name="landlordMode"
                value={option.value}
                checked={landlordMode === option.value}
                onChange={() => onLandlordModeChange(option.value)}
                className="sr-only"
              />
              <span className="block text-sm font-semibold text-foreground">
                {option.title}
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                {option.description}
              </span>
            </label>
          ))}
        </div>

        {landlordMode === "existing" ? (
          <label className="block">
            <span className={labelClassName}>
              Select landlord <span className="text-red-500">*</span>
            </span>
            <select
              name="existingLandlordProfileId"
              defaultValue=""
              className={fieldClassName}
            >
              <option value="">Choose landlord</option>
              {landlordProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {[profile.displayName, profile.phone, profile.email]
                    .filter(Boolean)
                    .join(" - ")}
                </option>
              ))}
            </select>
            {landlordProfiles.length === 0 ? (
              <span className="mt-2 block text-xs text-amber-700 dark:text-amber-200">
                No landlord profiles found. Choose “New landlord” to create one.
              </span>
            ) : null}
          </label>
        ) : null}

        {landlordMode === "new" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className={labelClassName}>
                Full name <span className="text-red-500">*</span>
              </span>
              <input
                name="landlordFullName"
                type="text"
                maxLength={120}
                placeholder="Jane Wanjiku"
                className={fieldClassName}
              />
            </label>

            <label className="block">
              <span className={labelClassName}>
                Username <span className="text-red-500">*</span>
              </span>
              <input
                name="landlordUsername"
                type="text"
                minLength={3}
                maxLength={60}
                autoComplete="username"
                placeholder="jane-landlord"
                className={fieldClassName}
              />
            </label>

            <label className="block">
              <span className={labelClassName}>
                Password <span className="text-red-500">*</span>
              </span>
              <input
                name="landlordPassword"
                type="password"
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className={fieldClassName}
              />
            </label>

            <label className="block">
              <span className={labelClassName}>Email</span>
              <input
                name="landlordEmail"
                type="email"
                autoComplete="email"
                placeholder="owner@example.com"
                className={fieldClassName}
              />
            </label>

            <label className="block">
              <span className={labelClassName}>Mobile number</span>
              <input
                name="landlordPhone"
                type="tel"
                autoComplete="tel"
                placeholder="0712345678"
                className={fieldClassName}
              />
            </label>

            <label className="block">
              <span className={labelClassName}>National ID</span>
              <input
                name="landlordNationalId"
                type="text"
                maxLength={80}
                className={fieldClassName}
              />
            </label>

            <label className="block md:col-span-2">
              <span className={labelClassName}>Notes</span>
              <textarea
                name="landlordNotes"
                rows={3}
                maxLength={1000}
                placeholder="Ownership notes or contact preferences."
                className={textareaClassName}
              />
            </label>
          </div>
        ) : null}

        <div className={calloutInfoClassName}>
          Landlord access is property-scoped. A landlord account created here
          will only see this linked apartment/property and its units.
        </div>
      </div>
    </section>
  );
}