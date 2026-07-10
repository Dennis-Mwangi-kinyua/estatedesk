"use client";

import {
  fieldClassName,
  infoPanelClassName,
  labelClassName,
  stepDescriptionClassName,
  stepTitleClassName,
} from "../_lib/wizard-ui";

export function StepBilling({ currencyCode }: { currencyCode: string }) {
  return (
    <section className="block">
      <div className="space-y-5">
        <div>
          <h2 className={stepTitleClassName}>Billing & availability</h2>
          <p className={stepDescriptionClassName}>
            Configure default water billing values and decide whether the property
            should be active immediately.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className={labelClassName}>
              Water rate per unit ({currencyCode})
            </span>
            <input
              name="waterRatePerUnit"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="75.00"
              className={fieldClassName}
            />
          </label>

          <label className="block">
            <span className={labelClassName}>
              Water fixed charge ({currencyCode})
            </span>
            <input
              name="waterFixedCharge"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              placeholder="250.00"
              className={fieldClassName}
            />
          </label>
        </div>

        <div className={infoPanelClassName}>
          <label className="flex items-start gap-3">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <span>
              <span className="block text-sm font-medium text-foreground">
                Active on creation
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                Active properties can be used immediately across units, leases,
                maintenance, reporting, and billing workflows.
              </span>
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}