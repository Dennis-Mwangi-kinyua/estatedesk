"use client";

import { memo, useMemo, type ChangeEvent } from "react";
import {
  decodeAssignmentTargetValue,
  encodeAssignmentTargetValue,
} from "../_lib/assignment-target-encoding";
import { STAFF_FORM_INPUT_CLASS } from "../_lib/helpers";
import { STAFF_MUTED_PANEL_CLASS } from "../_lib/wizard-ui";
import type { AssignmentTarget } from "../_lib/types";

export const AssignmentTargetPicker = memo(function AssignmentTargetPicker({
  availableTargets,
  selectedTarget,
  onSelectTarget,
  onClearSelectedTarget,
}: {
  availableTargets: AssignmentTarget[];
  selectedTarget: AssignmentTarget | null;
  onSelectTarget: (target: AssignmentTarget) => void;
  onClearSelectedTarget: () => void;
}) {
  const propertyTargets = useMemo(
    () => availableTargets.filter((target) => target.type === "PROPERTY"),
    [availableTargets],
  );

  const buildingTargets = useMemo(
    () => availableTargets.filter((target) => target.type === "BUILDING"),
    [availableTargets],
  );

  const selectedValue = selectedTarget
    ? encodeAssignmentTargetValue(selectedTarget)
    : "";

  const handleTargetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const decoded = decodeAssignmentTargetValue(event.target.value);

    if (!decoded) {
      onClearSelectedTarget();
      return;
    }

    const target = availableTargets.find(
      (item) => item.type === decoded.type && item.id === decoded.id,
    );

    if (target) {
      onSelectTarget(target);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="caretaker-assignment-target"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Assignment scope
        </label>
        <select
          id="caretaker-assignment-target"
          value={selectedValue}
          onChange={handleTargetChange}
          className={STAFF_FORM_INPUT_CLASS}
        >
          <option value="">
            {availableTargets.length > 0
              ? "Select a property or apartment/block"
              : "No properties or apartments available"}
          </option>
          {propertyTargets.length > 0 ? (
            <optgroup label="Properties">
              {propertyTargets.map((target) => (
                <option
                  key={encodeAssignmentTargetValue(target)}
                  value={encodeAssignmentTargetValue(target)}
                >
                  {target.label}
                </option>
              ))}
            </optgroup>
          ) : null}
          {buildingTargets.length > 0 ? (
            <optgroup label="Apartments / blocks">
              {buildingTargets.map((target) => (
                <option
                  key={encodeAssignmentTargetValue(target)}
                  value={encodeAssignmentTargetValue(target)}
                >
                  {target.label}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Assign a whole property or a specific apartment/block. Multiple
          caretakers can share the same apartment.
        </p>
      </div>

      <div className={`${STAFF_MUTED_PANEL_CLASS} px-4 py-3`}>
        {selectedTarget ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Selected scope
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {selectedTarget.label}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedTarget.type === "PROPERTY"
                ? "Property-wide coverage"
                : "Apartment/block coverage"}
            </p>
          </div>
        ) : availableTargets.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Choose where this caretaker will operate before continuing.
          </p>
        ) : (
          <div>
            <p className="text-sm font-medium text-foreground">
              No properties or apartments available yet.
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Create a property and apartment/block under Properties first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});