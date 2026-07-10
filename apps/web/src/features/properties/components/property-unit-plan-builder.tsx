"use client";

import { useState } from "react";
import {
  buttonDangerClassName,
  buttonPrimaryClassName,
  buttonSecondaryClassName,
  emptyStateClassName,
  fieldClassName,
  infoPanelClassName,
  labelClassName,
  textareaClassName,
} from "./_lib/wizard-ui";

type UnitTypeOption = {
  value: string;
  label: string;
  supportsBedrooms: boolean;
};

const UNIT_TYPE_OPTIONS: UnitTypeOption[] = [
  { value: "APARTMENT", label: "Apartment", supportsBedrooms: true },
  { value: "BEDSITTER", label: "Bedsitter", supportsBedrooms: false },
  { value: "STUDIO", label: "Studio", supportsBedrooms: false },
  { value: "SINGLE_ROOM", label: "Single room", supportsBedrooms: false },
  { value: "SHOP", label: "Shop", supportsBedrooms: false },
  { value: "OFFICE", label: "Office", supportsBedrooms: false },
  { value: "STALL", label: "Stall", supportsBedrooms: false },
  { value: "WAREHOUSE", label: "Warehouse", supportsBedrooms: false },
  { value: "GODOWN", label: "Godown", supportsBedrooms: false },
];

type UnitPlanRow = {
  id: string;
  unitType: string;
  bedrooms: string;
  bathrooms: string;
  quantity: string;
  defaultRentAmount: string;
  defaultDepositAmount: string;
  houseNoPrefix: string;
  startNumber: string;
  label: string;
  notes: string;
};

function makeRow(unitType = "APARTMENT"): UnitPlanRow {
  return {
    id: crypto.randomUUID(),
    unitType,
    bedrooms: unitType === "APARTMENT" ? "1" : "",
    bathrooms: "",
    quantity: "1",
    defaultRentAmount: "",
    defaultDepositAmount: "",
    houseNoPrefix: "",
    startNumber: "1",
    label: "",
    notes: "",
  };
}

function unitTypeLabel(unitType: string, bedrooms: string) {
  if (unitType === "APARTMENT" && bedrooms) {
    return `${bedrooms} Bedroom Apartment`;
  }

  const match = UNIT_TYPE_OPTIONS.find((item) => item.value === unitType);
  return match?.label ?? "Unit";
}

export function PropertyUnitPlanBuilder({
  currencyCode,
}: {
  currencyCode: string;
}) {
  const [rows, setRows] = useState<UnitPlanRow[]>([]);

  const addRow = (unitType = "APARTMENT") => {
    setRows((current) => [...current, makeRow(unitType)]);
  };

  const updateRow = (
    rowId: string,
    key: keyof UnitPlanRow,
    value: string,
  ) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) return row;

        if (key === "unitType") {
          const selected = UNIT_TYPE_OPTIONS.find((item) => item.value === value);
          const supportsBedrooms = selected?.supportsBedrooms ?? false;

          return {
            ...row,
            unitType: value,
            bedrooms: supportsBedrooms ? row.bedrooms || "1" : "",
          };
        }

        return {
          ...row,
          [key]: value,
        };
      }),
    );
  };

  const removeRow = (rowId: string) => {
    setRows((current) => current.filter((row) => row.id !== rowId));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addRow("APARTMENT")}
          className={buttonSecondaryClassName}
        >
          Add apartment
        </button>
        <button
          type="button"
          onClick={() => addRow("BEDSITTER")}
          className={buttonSecondaryClassName}
        >
          Add bedsitter
        </button>
        <button
          type="button"
          onClick={() => addRow("STUDIO")}
          className={buttonSecondaryClassName}
        >
          Add studio
        </button>
        <button
          type="button"
          onClick={() => addRow("SINGLE_ROOM")}
          className={buttonSecondaryClassName}
        >
          Add single room
        </button>
      </div>

      {rows.length === 0 ? (
        <div className={emptyStateClassName}>
          <h3 className="text-sm font-semibold text-foreground">
            No unit mix added yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add unit types and quantities now so the property automatically creates
            units that appear on the units page.
          </p>

          <button
            type="button"
            onClick={() => addRow("APARTMENT")}
            className={`mt-4 ${buttonPrimaryClassName}`}
          >
            Add first unit mix
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => {
            const selectedType = UNIT_TYPE_OPTIONS.find(
              (item) => item.value === row.unitType,
            );
            const supportsBedrooms = selectedType?.supportsBedrooms ?? false;

            return (
              <div
                key={row.id}
                className={`${infoPanelClassName} sm:p-5`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Unit mix {index + 1}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-foreground">
                      {unitTypeLabel(row.unitType, row.bedrooms)}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className={buttonDangerClassName}
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="block">
                    <span className={labelClassName}>
                      Unit type <span className="text-red-500">*</span>
                    </span>
                    <select
                      name="unitPlanUnitType[]"
                      value={row.unitType}
                      onChange={(event) =>
                        updateRow(row.id, "unitType", event.target.value)
                      }
                      className={fieldClassName}
                    >
                      {UNIT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className={labelClassName}>
                      Bedrooms {supportsBedrooms ? <span className="text-red-500">*</span> : null}
                    </span>
                    {supportsBedrooms ? (
                      <select
                        name="unitPlanBedrooms[]"
                        value={row.bedrooms}
                        onChange={(event) =>
                          updateRow(row.id, "bedrooms", event.target.value)
                        }
                        className={fieldClassName}
                      >
                        <option value="1">1 bedroom</option>
                        <option value="2">2 bedrooms</option>
                        <option value="3">3 bedrooms</option>
                        <option value="4">4 bedrooms</option>
                      </select>
                    ) : (
                      <>
                        <input type="hidden" name="unitPlanBedrooms[]" value="" />
                        <div className="flex h-11 items-center rounded-2xl border border-border bg-background px-4 text-sm text-muted-foreground">
                          Not applicable for this unit type
                        </div>
                      </>
                    )}
                  </label>

                  <label className="block">
                    <span className={labelClassName}>
                      Bathrooms
                    </span>
                    <input
                      name="unitPlanBathrooms[]"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={row.bathrooms}
                      onChange={(event) =>
                        updateRow(row.id, "bathrooms", event.target.value)
                      }
                      placeholder="Optional"
                      className={fieldClassName}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>
                      Quantity <span className="text-red-500">*</span>
                    </span>
                    <input
                      name="unitPlanQuantity[]"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={row.quantity}
                      onChange={(event) =>
                        updateRow(row.id, "quantity", event.target.value)
                      }
                      className={fieldClassName}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>
                      Default rent ({currencyCode}) <span className="text-red-500">*</span>
                    </span>
                    <input
                      name="unitPlanDefaultRentAmount[]"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={row.defaultRentAmount}
                      onChange={(event) =>
                        updateRow(row.id, "defaultRentAmount", event.target.value)
                      }
                      placeholder="0.00"
                      className={fieldClassName}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>
                      Default deposit ({currencyCode})
                    </span>
                    <input
                      name="unitPlanDefaultDepositAmount[]"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={row.defaultDepositAmount}
                      onChange={(event) =>
                        updateRow(
                          row.id,
                          "defaultDepositAmount",
                          event.target.value,
                        )
                      }
                      placeholder="Optional"
                      className={fieldClassName}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>
                      House number prefix
                    </span>
                    <input
                      name="unitPlanHouseNoPrefix[]"
                      type="text"
                      maxLength={10}
                      value={row.houseNoPrefix}
                      onChange={(event) =>
                        updateRow(row.id, "houseNoPrefix", event.target.value)
                      }
                      placeholder="A, B, SH, OF"
                      className={fieldClassName}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>
                      Start number
                    </span>
                    <input
                      name="unitPlanStartNumber[]"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={row.startNumber}
                      onChange={(event) =>
                        updateRow(row.id, "startNumber", event.target.value)
                      }
                      className={fieldClassName}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClassName}>
                      Label
                    </span>
                    <input
                      name="unitPlanLabel[]"
                      type="text"
                      maxLength={120}
                      value={row.label}
                      onChange={(event) =>
                        updateRow(row.id, "label", event.target.value)
                      }
                      placeholder="Optional custom label"
                      className={fieldClassName}
                    />
                  </label>

                  <label className="block md:col-span-2 xl:col-span-3">
                    <span className={labelClassName}>
                      Notes
                    </span>
                    <textarea
                      name="unitPlanNotes[]"
                      rows={3}
                      value={row.notes}
                      onChange={(event) =>
                        updateRow(row.id, "notes", event.target.value)
                      }
                      placeholder="Optional internal note for this unit mix"
                      className={textareaClassName}
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}