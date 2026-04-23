"use client";

import { useState } from "react";

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
          className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Add apartment
        </button>
        <button
          type="button"
          onClick={() => addRow("BEDSITTER")}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Add bedsitter
        </button>
        <button
          type="button"
          onClick={() => addRow("STUDIO")}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Add studio
        </button>
        <button
          type="button"
          onClick={() => addRow("SINGLE_ROOM")}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
        >
          Add single room
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-10 text-center">
          <h3 className="text-sm font-semibold text-neutral-900">
            No unit mix added yet
          </h3>
          <p className="mt-2 text-sm text-neutral-500">
            Add unit types and quantities now so the property automatically creates
            units that appear on the units page.
          </p>

          <button
            type="button"
            onClick={() => addRow("APARTMENT")}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800"
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
                className="rounded-3xl border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                      Unit mix {index + 1}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-neutral-950">
                      {unitTypeLabel(row.unitType, row.bedrooms)}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-red-200 px-4 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-700">
                      Unit type <span className="text-red-500">*</span>
                    </span>
                    <select
                      name="unitPlanUnitType[]"
                      value={row.unitType}
                      onChange={(event) =>
                        updateRow(row.id, "unitType", event.target.value)
                      }
                      className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                    >
                      {UNIT_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-700">
                      Bedrooms {supportsBedrooms ? <span className="text-red-500">*</span> : null}
                    </span>
                    {supportsBedrooms ? (
                      <select
                        name="unitPlanBedrooms[]"
                        value={row.bedrooms}
                        onChange={(event) =>
                          updateRow(row.id, "bedrooms", event.target.value)
                        }
                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                      >
                        <option value="1">1 bedroom</option>
                        <option value="2">2 bedrooms</option>
                        <option value="3">3 bedrooms</option>
                        <option value="4">4 bedrooms</option>
                      </select>
                    ) : (
                      <>
                        <input type="hidden" name="unitPlanBedrooms[]" value="" />
                        <div className="flex h-12 items-center rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-500">
                          Not applicable for this unit type
                        </div>
                      </>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-700">
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
                      className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-700">
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
                      className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-700">
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
                      className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-700">
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
                      className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-700">
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
                      className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-700">
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
                      className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-neutral-700">
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
                      className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                    />
                  </label>

                  <label className="block md:col-span-2 xl:col-span-3">
                    <span className="mb-2 block text-sm font-medium text-neutral-700">
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
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
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