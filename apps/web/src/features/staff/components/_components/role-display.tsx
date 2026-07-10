"use client";

import { memo } from "react";
import { ROLE_META, type StaffRole } from "@/features/staff/constants/role-meta";
import { RoleCapabilityCard } from "./role-capability-card";

export const RoleDisplay = memo(function RoleDisplay({
  role,
}: {
  role: StaffRole;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-800">
        Role
      </label>
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-800">
        {ROLE_META[role].label}
      </div>
      <RoleCapabilityCard role={role} />
    </div>
  );
});