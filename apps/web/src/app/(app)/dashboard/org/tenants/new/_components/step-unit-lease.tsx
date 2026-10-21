import { UnitCombobox } from "../unit-combobox";
import { inputClassName, stepPanelClassName } from "../_lib/constants";
import { formatCurrency } from "../_lib/helpers";
import type { AvailableUnit } from "../_lib/types";
import { FieldLabel, SectionTitle } from "./ui-primitives";
import { OpeningArrearsFields } from "./opening-arrears-fields";

export function StepUnitLease({
  existingLease,
  isPending,
  currencyCode,
  availableUnits,
  selectedUnitId,
  selectedUnit,
  onSelectUnit,
}: {
  existingLease: boolean;
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
        title={existingLease ? "Existing unit and lease" : "Unit mapping during creation"}
        description={existingLease ? "Assign the tenant’s unit and enter their original lease start date." : "Assign a vacant unit now, or leave it blank and map the tenant later."}
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
          <FieldLabel required={existingLease}>{existingLease ? "Original lease start date" : "Lease start date"}</FieldLabel>
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
          <FieldLabel required={!!selectedUnit}>Agreed monthly rent ({currencyCode})</FieldLabel>
          <input
            key={`rent-${selectedUnitId}`}
            defaultValue={selectedUnit?.rentAmount ?? ""}
            name="monthlyRent"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Enter the agreed monthly rent"
            className={inputClassName}
            disabled={isPending}
          />
        </label>

        <label className="block">
          <FieldLabel required={!!selectedUnit}>Agreed deposit ({currencyCode})</FieldLabel>
          <input
            key={`deposit-${selectedUnitId}`}
            defaultValue={selectedUnit ? selectedUnit.depositAmount ?? 0 : ""}
            name="deposit"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Enter the agreed deposit, or 0"
            className={inputClassName}
            disabled={isPending}
          />
        </label>
        <p className="text-sm text-muted-foreground md:col-span-2">{existingLease ? "These are the agreed amounts for this lease. Only the unpaid previous balances entered below are imported; initial rent and deposit are not charged again." : "Review the suggested amounts and enter what this tenant agreed to pay. These amounts create the first rent and deposit bill and set the lease rent going forward."}</p>
        <OpeningArrearsFields existing={existingLease} disabled={isPending} currencyCode={currencyCode} />
      </div>
    </div>
  );
}
