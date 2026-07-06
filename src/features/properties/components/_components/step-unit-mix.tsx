"use client";

import { PropertyUnitPlanBuilder } from "@/features/properties/components/property-unit-plan-builder";
import { stepDescriptionClassName, stepTitleClassName } from "../_lib/wizard-ui";

export function StepUnitMix({ currencyCode }: { currencyCode: string }) {
  return (
    <section className="block">
      <div className="space-y-5">
        <div>
          <h2 className={stepTitleClassName}>Initial unit mix</h2>
          <p className={stepDescriptionClassName}>
            Add the unit mix for this property. On submit, the system will save
            the plan and generate the actual units automatically.
          </p>
        </div>

        <PropertyUnitPlanBuilder currencyCode={currencyCode} />
      </div>
    </section>
  );
}