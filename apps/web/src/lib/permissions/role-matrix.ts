import type { OrgRole } from "@prisma/client";

export const ORG_PERMISSIONS = [
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
    "payments.record",
    "payments.manage",
    "payments.verify",
    "reports.view",
    "reports.export",
  ],
  CARETAKER: ["caretaker.fieldwork", "maintenance.manage", "inspections.manage"],
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
