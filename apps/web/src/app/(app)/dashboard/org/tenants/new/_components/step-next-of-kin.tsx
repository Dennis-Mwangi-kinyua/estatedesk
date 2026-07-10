"use client";

import { inputClassName, stepPanelClassName } from "../_lib/constants";
import { FieldLabel, SectionTitle } from "./ui-primitives";

export function StepNextOfKin({ isPending }: { isPending: boolean }) {
  return (
    <div className={stepPanelClassName}>
      <SectionTitle
        title="Next of kin details"
        description="Add a next of kin or emergency contact for this tenant."
      />

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <FieldLabel required>Next of kin name</FieldLabel>
          <input
            name="nextOfKinName"
            type="text"
            maxLength={120}
            placeholder="John Wanjala"
            autoComplete="name"
            enterKeyHint="next"
            className={inputClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <FieldLabel required>Relationship</FieldLabel>
          <input
            name="nextOfKinRelationship"
            type="text"
            maxLength={80}
            placeholder="Brother, Mother, Spouse..."
            enterKeyHint="next"
            className={inputClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <FieldLabel required>Phone</FieldLabel>
          <input
            name="nextOfKinPhone"
            type="text"
            maxLength={30}
            placeholder="0700000000"
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
            name="nextOfKinEmail"
            type="email"
            maxLength={120}
            placeholder="Optional"
            autoComplete="email"
            enterKeyHint="next"
            className={inputClassName}
            disabled={isPending}
          />
        </label>
      </div>
    </div>
  );
}