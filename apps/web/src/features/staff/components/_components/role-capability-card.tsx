"use client";

import { WorkspaceIcon } from "@/components/shared/workspace-icon";

import { memo } from "react";
import type { StaffRole } from "@/features/staff/constants/role-meta";
import { ROLE_CAPABILITIES } from "../_lib/helpers";

export const RoleCapabilityCard = memo(function RoleCapabilityCard({
  role,
}: {
  role: StaffRole;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-semibold text-foreground">
        What this role can do
      </p>
      <div className="mt-3 grid gap-2">
        {ROLE_CAPABILITIES[role].map((capability) => (
          <p
            key={capability}
            className="flex items-start gap-2 rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm leading-5 text-muted-foreground"
          >
            <WorkspaceIcon label="verified" className="mt-0.5 h-4 w-4 text-emerald-700 dark:text-emerald-300" /><span>{capability}</span>
          </p>
        ))}
      </div>
    </div>
  );
});