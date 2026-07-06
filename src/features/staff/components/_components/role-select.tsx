"use client";

import { memo } from "react";
import {
  ROLE_META,
  STAFF_ROLES,
  type StaffRole,
} from "@/features/staff/constants/role-meta";
import { STAFF_FORM_INPUT_CLASS } from "../_lib/helpers";
import { RoleCapabilityCard } from "./role-capability-card";

export const RoleSelect = memo(function RoleSelect({
  selectedRole,
  onChange,
}: {
  selectedRole: StaffRole;
  onChange: (role: StaffRole) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        Role
      </label>
      <select
        name="role"
        value={selectedRole}
        onChange={(event) => onChange(event.target.value as StaffRole)}
        className={STAFF_FORM_INPUT_CLASS}
      >
        {STAFF_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {STAFF_ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            className={`rounded-2xl border p-3 text-left transition ${
              selectedRole === role
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-muted/15 text-foreground hover:border-primary/30"
            }`}
          >
            <span className="block text-sm font-semibold">
              {ROLE_META[role].label}
            </span>
            <span
              className={`mt-1 block text-xs leading-5 ${
                selectedRole === role
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground"
              }`}
            >
              {ROLE_META[role].description}
            </span>
          </button>
        ))}
      </div>
      <RoleCapabilityCard role={selectedRole} />
    </div>
  );
});