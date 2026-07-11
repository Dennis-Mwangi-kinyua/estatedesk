/**
 * Organization permission surface.
 *
 * Canonical source: role-matrix.ts (OrgPermission + roleHasOrgPermission).
 * Prefer requireOrgPermission() from guards.ts on server actions.
 *
 * Legacy AppPermission names are mapped for any remaining call sites.
 */
export {
  ORG_PERMISSIONS,
  ORG_ROLE_PERMISSIONS,
  roleHasOrgPermission,
  type OrgPermission,
} from "@/lib/permissions/role-matrix";

export {
  requireOrgPermission,
  requireOrgRole,
  requireOrgMembership,
  requireManagementAccess,
  requirePlatformRole,
} from "@/lib/permissions/guards";

import type { OrgRole } from "@prisma/client";
import { roleHasOrgPermission, type OrgPermission } from "@/lib/permissions/role-matrix";

/** @deprecated Prefer OrgPermission from role-matrix. */
export type AppPermission =
  | "properties.read"
  | "properties.write"
  | "units.read"
  | "units.write"
  | "tenants.read"
  | "tenants.write"
  | "leases.read"
  | "leases.write"
  | "payments.read"
  | "payments.write"
  | "charges.read"
  | "charges.write"
  | "issues.read"
  | "issues.write"
  | "platform.read"
  | "platform.write";

const legacyToOrgPermission: Partial<Record<AppPermission, OrgPermission>> = {
  "properties.write": "properties.manage",
  "units.write": "properties.manage",
  "tenants.write": "tenants.manage",
  "leases.write": "leases.manage",
  "payments.write": "payments.manage",
  "charges.write": "payments.manage",
  "issues.write": "maintenance.manage",
  "properties.read": "properties.manage",
  "units.read": "properties.manage",
  "tenants.read": "tenants.manage",
  "leases.read": "leases.manage",
  "payments.read": "payments.manage",
  "charges.read": "payments.manage",
  "issues.read": "maintenance.manage",
  "platform.read": "org.settings.manage",
  "platform.write": "org.settings.manage",
};

/**
 * @deprecated Use roleHasOrgPermission with OrgPermission instead.
 * LANDLORD is intentionally limited to reports.view (not full access).
 */
export function hasPermission(role: OrgRole | null | undefined, permission: AppPermission) {
  if (!role) return false;
  const mapped = legacyToOrgPermission[permission];
  if (!mapped) return false;
  // Read-style legacy perms: allow if role has the manage permission OR reports.view for reports-like access
  if (permission.endsWith(".read") && roleHasOrgPermission(role, "reports.view")) {
    if (
      permission === "payments.read" ||
      permission === "charges.read" ||
      permission === "tenants.read" ||
      permission === "leases.read" ||
      permission === "properties.read" ||
      permission === "units.read"
    ) {
      return roleHasOrgPermission(role, mapped) || role === "LANDLORD" || role === "ACCOUNTANT";
    }
  }
  return roleHasOrgPermission(role, mapped);
}
