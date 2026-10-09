"use client";

import { VisualSticker } from "@/components/shared/visual-sticker";

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
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        Role
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm font-medium text-foreground">
        <VisualSticker label={ROLE_META[role].label} size="xs" />{ROLE_META[role].label}
      </div>
      <RoleCapabilityCard role={role} />
    </div>
  );
});