"use client";

import { useActionState, useMemo, useState } from "react";
import { createCaretakerAction } from "@/features/staff/actions/create-caretaker-action";

type PropertyOption = {
  id: string;
  name: string;
  location: string | null;
};

type BuildingOption = {
  id: string;
  name: string;
  propertyId: string;
  property: {
    name: string;
  };
};

type UnitOption = {
  id: string;
  houseNo: string;
  propertyId: string;
  buildingId: string | null;
  property: {
    name: string;
  };
  building: {
    name: string;
  } | null;
};

type CreateCaretakerFormProps = {
  properties: PropertyOption[];
  buildings: BuildingOption[];
  units: UnitOption[];
};

const initialCreateCaretakerState = {
  error: null as string | null,
};

export function CreateCaretakerForm({
  properties,
  buildings,
  units,
}: CreateCaretakerFormProps) {
  const [state, formAction, pending] = useActionState(
    createCaretakerAction,
    initialCreateCaretakerState,
  );

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const filteredBuildings = useMemo(() => {
    if (!selectedPropertyId) return buildings;

    return buildings.filter(
      (building) => building.propertyId === selectedPropertyId,
    );
  }, [buildings, selectedPropertyId]);

  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const propertyMatches = selectedPropertyId
        ? unit.propertyId === selectedPropertyId
        : true;

      const buildingMatches = selectedBuildingId
        ? unit.buildingId === selectedBuildingId
        : true;

      return propertyMatches && buildingMatches;
    });
  }, [units, selectedPropertyId, selectedBuildingId]);

  function handlePropertyChange(value: string) {
    setSelectedPropertyId(value);
    setSelectedBuildingId("");
    setSelectedUnitId("");
  }

  function handleBuildingChange(value: string) {
    setSelectedBuildingId(value);
    setSelectedUnitId("");
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Personal details
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="Enter phone number"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-slate-100 pt-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            Assignment mapping
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Choose the property, building, or apartment this caretaker should
            manage.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="propertyId"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Property
            </label>
            <select
              id="propertyId"
              name="propertyId"
              value={selectedPropertyId}
              onChange={(event) => handlePropertyChange(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="">Select property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                  {property.location ? ` — ${property.location}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="buildingId"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Building
            </label>
            <select
              id="buildingId"
              name="buildingId"
              value={selectedBuildingId}
              onChange={(event) => handleBuildingChange(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="">Select building</option>
              {filteredBuildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.property.name} — {building.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="unitId"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Apartment / unit
            </label>
            <select
              id="unitId"
              name="unitId"
              value={selectedUnitId}
              onChange={(event) => setSelectedUnitId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="">Select apartment / unit</option>
              {filteredUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.property.name}
                  {unit.building?.name ? ` — ${unit.building.name}` : ""}
                  {` — Unit ${unit.houseNo}`}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="notes"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Assignment notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              placeholder="Add any assignment notes or operational instructions"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input
                type="checkbox"
                name="isPrimary"
                value="true"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300"
              />
              Mark this as the primary caretaker assignment
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating caretaker..." : "Create caretaker"}
        </button>
      </div>
    </form>
  );
}