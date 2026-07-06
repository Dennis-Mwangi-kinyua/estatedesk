"use client";

import { UnitCombobox } from "../unit-combobox";
import { inputClassName, stepPanelClassName } from "../_lib/constants";
import { formatCurrency } from "../_lib/helpers";
import type { AvailableUnit } from "../_lib/types";
import { FieldLabel, SectionTitle } from "./ui-primitives";

export function StepUnitLease({
  isPending,
  currencyCode,
  availableUnits,
  selectedUnitId,
  selectedUnit,
  onSelectUnit,
}: {
  isPending: boolean;
  currencyCode: string;
  availableUnits: AvailableUnit[];
  selectedUnitId: string;
  selectedUnit: AvailableUnit | null;
  onSelectUnit: (unitId: string) => void;
}) {
  return (
    <div className={stepPanelClassName}>
      <SectionTitle
        title="Unit mapping during creation"
        description="Assign a vacant unit now, or leave it blank and map the tenant later."
      />

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <FieldLabel>Assign unit</FieldLabel>

          <UnitCombobox
            units={availableUnits}
            selectedUnitId={selectedUnitId}
            onSelect={onSelectUnit}
            currencyCode={currencyCode}
          />
        </label>

        <div className="rounded-2xl border border-border bg-card p-4 md:col-span-2">
          {selectedUnit ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Selected unit
              </p>
              <p className="text-sm font-medium text-foreground">{selectedUnit.label}</p>
              <div className="grid gap-2 pt-1 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/10 px-3 py-3 text-sm text-muted-foreground">
                  <span className="block text-xs">Rent</span>
                  <span className="mt-1 block font-medium text-foreground">
                    {formatCurrency(selectedUnit.rentAmount, currencyCode)}
                  </span>
                </div>
                <div className="rounded-2xl bg-muted/10 px-3 py-3 text-sm text-muted-foreground">
                  <span className="block text-xs">Deposit</span>
                  <span className="mt-1 block font-medium text-foreground">
                    {formatCurrency(selectedUnit.depositAmount, currencyCode)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No unit selected yet.</div>
          )}
        </div>

        <label className="block">
          <FieldLabel>Lease start date</FieldLabel>
          <input
            name="leaseStartDate"
            type="date"
            className={inputClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <FieldLabel>Rent due day</FieldLabel>
          <input
            name="dueDay"
            type="number"
            min="1"
            max="31"
            defaultValue="5"
            inputMode="numeric"
            className={inputClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <FieldLabel>Monthly rent override ({currencyCode})</FieldLabel>
          <input
            name="monthlyRent"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Leave blank to use unit rent"
            className={inputClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <FieldLabel>Deposit override ({currencyCode})</FieldLabel>
          <input
            name="deposit"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Leave blank to use unit deposit"
            className={inputClassName}
            disabled={isPending}
          />
        </label>
      </div>
    </div>
  );
}