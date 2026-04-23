export const ORG_ROLES = [
  "ADMIN",
  "MANAGER",
  "OFFICE",
  "ACCOUNTANT",
  "CARETAKER",
  "TENANT",
] as const;

export const STAFF_ROLES = [
  "ADMIN",
  "MANAGER",
  "OFFICE",
  "ACCOUNTANT",
  "CARETAKER",
] as const;

export const TENANT_ROLE = "TENANT" as const;

export type OrgRole = (typeof ORG_ROLES)[number];
export type StaffRole = (typeof STAFF_ROLES)[number];

type RoleMeta = {
  label: string;
  shortLabel: string;
  description: string;
  emoji: string;
  badgeClass: string;
  cardClass: string;
};

export const ROLE_META: Record<OrgRole, RoleMeta> = {
  ADMIN: {
    label: "Admin",
    shortLabel: "AD",
    description: "Organisation oversight, access control, and configuration.",
    emoji: "AD",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    cardClass: "from-white to-slate-50",
  },
  MANAGER: {
    label: "Manager",
    shortLabel: "MG",
    description: "Day-to-day supervision across properties and operations.",
    emoji: "MG",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    cardClass: "from-white to-slate-50",
  },
  OFFICE: {
    label: "Office",
    shortLabel: "OF",
    description: "Administrative coordination, support, and records workflow.",
    emoji: "OF",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    cardClass: "from-white to-slate-50",
  },
  ACCOUNTANT: {
    label: "Accountant",
    shortLabel: "AC",
    description: "Finance operations, billing, reconciliation, and reporting.",
    emoji: "AC",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    cardClass: "from-white to-slate-50",
  },
  CARETAKER: {
    label: "Caretaker",
    shortLabel: "CT",
    description: "On-site property support, maintenance coordination, and follow-up.",
    emoji: "CT",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    cardClass: "from-white to-slate-50",
  },
  TENANT: {
    label: "Tenant",
    shortLabel: "TN",
    description: "Residents and occupants linked to the organisation.",
    emoji: "TN",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    cardClass: "from-white to-slate-50",
  },
};

export const DIRECTORY_META = {
  staff: {
    label: "Staff Directory",
    shortLabel: "ST",
    description: "View and manage all staff members across organisation roles.",
    href: "/staff",
  },
  caretaker: {
    label: "Caretaker Directory",
    shortLabel: "CT",
    description: "Manage caretakers assigned to operational and on-site responsibilities.",
    href: "/staff/caretaker",
  },
  admin: {
    label: "Admin Directory",
    shortLabel: "AD",
    description: "Manage administrators with organisation-wide oversight and access.",
    href: "/staff/admin",
  },
  tenant: {
    label: "Tenant Directory",
    shortLabel: "TN",
    description: "Access tenant records, occupancy details, and tenant management tools.",
    href: "/tenants",
  },
} as const;

export function isOrgRole(value: string): value is OrgRole {
  return ORG_ROLES.includes(value as OrgRole);
}

export function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLES.includes(value as StaffRole);
}

export function normalizeOrgRole(value: string): OrgRole | null {
  const upper = value.toUpperCase();
  return isOrgRole(upper) ? upper : null;
}

export function normalizeStaffRole(value: string): StaffRole | null {
  const upper = value.toUpperCase();
  return isStaffRole(upper) ? upper : null;
}