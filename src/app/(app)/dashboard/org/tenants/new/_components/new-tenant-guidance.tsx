"use client";

import { TENANT_SETUP_GUIDANCE } from "../_lib/constants";
import { formatCurrency } from "../_lib/helpers";
import type { AvailableUnit, Step } from "../_lib/types";
import { panelShellClassName } from "./ui-primitives";

export function NewTenantGuidance({
  step,
  selectedUnit,
  currencyCode,
}: {
  step: Step;
  selectedUnit: AvailableUnit | null;
  currencyCode: string;
}) {
  return (
    <aside className="space-y-4">
      {TENANT_SETUP_GUIDANCE.map((item) => (
        <section key={item.title} className={`${panelShellClassName} p-4`}>
          <h2 className="text-sm font-semibold text-foreground">{item.title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
        </section>
      ))}

      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Current selection</h2>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Step:</span> {step} of 5
          </p>
          <p>
            <span className="font-medium text-foreground">Unit:</span>{" "}
            {selectedUnit?.label ?? "Not selected"}
          </p>
          <p>
            <span className="font-medium text-foreground">Rent:</span>{" "}
            {selectedUnit
              ? formatCurrency(selectedUnit.rentAmount, currencyCode)
              : "—"}
          </p>
        </div>
      </section>
    </aside>
  );
}