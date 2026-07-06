"use client";

import { PROPERTY_TYPES } from "../_lib/constants";
import type { TaxpayerProfileOption } from "../_lib/types";
import {
  fieldClassName,
  labelClassName,
  stepDescriptionClassName,
  stepTitleClassName,
  textareaClassName,
} from "../_lib/wizard-ui";

export function StepPropertyProfile({
  taxpayerProfiles,
}: {
  taxpayerProfiles: TaxpayerProfileOption[];
}) {
  return (
    <section className="block">
      <div className="space-y-5">
        <div>
          <h2 className={stepTitleClassName}>Property profile</h2>
          <p className={stepDescriptionClassName}>
            Define the basic identity of the property and how it should appear
            across the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className={labelClassName}>
              Property name <span className="text-red-500">*</span>
            </span>
            <input
              name="name"
              type="text"
              maxLength={120}
              placeholder="Greenview Apartments"
              className={fieldClassName}
            />
          </label>

          <label className="block">
            <span className={labelClassName}>
              Property type <span className="text-red-500">*</span>
            </span>
            <select
              name="type"
              defaultValue="RESIDENTIAL"
              className={fieldClassName}
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClassName}>Taxpayer profile</span>
            <select
              name="taxpayerProfileId"
              defaultValue=""
              className={fieldClassName}
            >
              <option value="">No linked taxpayer profile</option>
              {taxpayerProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.displayName} - {profile.kraPin} ({profile.kind})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClassName}>Location</span>
            <input
              name="location"
              type="text"
              maxLength={160}
              placeholder="Kilimani, Nairobi"
              className={fieldClassName}
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Address</span>
            <input
              name="address"
              type="text"
              maxLength={220}
              placeholder="Wood Avenue, Block A"
              className={fieldClassName}
            />
          </label>

          <label className="block md:col-span-2">
            <span className={labelClassName}>Notes</span>
            <textarea
              name="notes"
              rows={5}
              maxLength={1500}
              placeholder="Internal notes, management remarks, or operational context."
              className={textareaClassName}
            />
          </label>
        </div>
      </div>
    </section>
  );
}