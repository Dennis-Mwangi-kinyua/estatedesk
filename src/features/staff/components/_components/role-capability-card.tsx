"use client";

import { memo } from "react";
import type { StaffRole } from "@/features/staff/constants/role-meta";
import { ROLE_CAPABILITIES } from "../_lib/helpers";

export const RoleCapabilityCard = memo(function RoleCapabilityCard({
  role,
}: {
  role: StaffRole;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-semibold text-neutral-950">
        What this role can do
      </p>
      <div className="mt-3 grid gap-2">
        {ROLE_CAPABILITIES[role].map((capability) => (
          <p
            key={capability}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm leading-5 text-neutral-700"
          >
            {capability}
          </p>
        ))}
      </div>
    </div>
  );
});