import type { OrgRole } from "@prisma/client";

export const ORG_PERMISSIONS = [
  "move-outs.arrears.approve",
  "finance.requests.review",
  "org.settings.manage",
  "org.users.manage",
  "org.users.delete",
  "properties.manage",
  "tenants.manage",
  "leases.manage",
  "payments.manage",
  "payments.verify",
  "payments.record",
  "reports.view",
  "reports.export",
  "maintenance.manage",
  "inspections.manage",
  "caretaker.fieldwork",
] as const;

export type OrgPermission = (typeof ORG_PERMISSIONS)[number];

export const ORG_ROLE_PERMISSIONS: Record<OrgRole, readonly OrgPermission[]> = {
  ADMIN: ORG_PERMISSIONS,
  MANAGER: [
    "finance.requests.review",
    "payments.record",
    "payments.verify",
    "properties.manage",
    "tenants.manage",
    "leases.manage",
    "reports.view",
    "maintenance.manage",
    "inspections.manage",
  ],
  OFFICE: [
    "payments.record",
    "tenants.manage",
    "leases.manage",
    "reports.view",
    "maintenance.manage",
    "inspections.manage",
  ],
  ACCOUNTANT: [
    "finance.requests.review",
    "payments.record",
    "payments.manage",
    "payments.verify",
    "reports.view",
    "reports.export",
  ],
  CARETAKER: ["caretaker.fieldwork", "maintenance.manage", "inspections.manage"],
  SECURITY: [],
  TENANT: [],
  LANDLORD: ["reports.view"],
};

export function roleHasOrgPermission(
  role: OrgRole | null | undefined,
  permission: OrgPermission,
) {
  if (!role) return false;
  return ORG_ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const DELEGATABLE_ORG_ROLES = ["MANAGER", "OFFICE", "ACCOUNTANT"] as const;
export function canReceiveOrgMandates(role: OrgRole | null | undefined) {
  return !!role && (DELEGATABLE_ORG_ROLES as readonly OrgRole[]).includes(role);
}
export function memberHasOrgPermission(member: { activeOrgRole?: OrgRole | null; grantedPermissions?: readonly string[] }, permission: OrgPermission) {
  return roleHasOrgPermission(member.activeOrgRole, permission) || (canReceiveOrgMandates(member.activeOrgRole) && !!member.grantedPermissions?.includes(permission));
}
export function validateOrgMandates(values: unknown[]): OrgPermission[] {
  if (values.some(value => typeof value !== "string" || (!(ORG_PERMISSIONS as readonly string[]).includes(value) || value === "caretaker.fieldwork"))) throw new Error("Choose valid staff permissions.");
  return [...new Set(values)] as OrgPermission[];
}
