"use client";

import { PropertyUnitPlanBuilder } from "@/features/properties/components/property-unit-plan-builder";
import { stepDescriptionClassName, stepTitleClassName } from "../_lib/wizard-ui";

export function StepUnitMix({ currencyCode }: { currencyCode: string }) {
  return (
    <section className="block">
      <div className="space-y-5">
        <div>
          <h2 className={stepTitleClassName}>Initial units</h2>
          <p className={stepDescriptionClassName}>
            Choose the types and quantities of individually rented spaces. For example,
            10 apartments creates 10 separate units. Apartments are not buildings.
          </p>
        </div>

        <PropertyUnitPlanBuilder currencyCode={currencyCode} />
      </div>
    </section>
  );
}