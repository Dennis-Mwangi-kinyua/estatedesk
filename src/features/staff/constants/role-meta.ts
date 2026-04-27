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
export type TenantRole = typeof TENANT_ROLE;

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
    emoji: "👑",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    cardClass: "from-white to-slate-50",
  },

  MANAGER: {
    label: "Manager",
    shortLabel: "MG",
    description: "Day-to-day supervision across properties and operations.",
    emoji: "📋",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    cardClass: "from-white to-blue-50",
  },

  OFFICE: {
    label: "Office",
    shortLabel: "OF",
    description: "Administrative coordination, support, and records workflow.",
    emoji: "🏢",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-700",
    cardClass: "from-white to-violet-50",
  },

  ACCOUNTANT: {
    label: "Accountant",
    shortLabel: "AC",
    description: "Finance operations, billing, reconciliation, and reporting.",
    emoji: "💰",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cardClass: "from-white to-emerald-50",
  },

  CARETAKER: {
    label: "Caretaker",
    shortLabel: "CT",
    description:
      "On-site property support, maintenance coordination, and follow-up.",
    emoji: "🛠️",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-700",
    cardClass: "from-white to-orange-50",
  },

  TENANT: {
    label: "Tenant",
    shortLabel: "TN",
    description: "Residents and occupants linked to the organisation.",
    emoji: "🏠",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-700",
    cardClass: "from-white to-sky-50",
  },
};

export const STAFF_ROLE_META: Record<StaffRole, RoleMeta> = {
  ADMIN: ROLE_META.ADMIN,
  MANAGER: ROLE_META.MANAGER,
  OFFICE: ROLE_META.OFFICE,
  ACCOUNTANT: ROLE_META.ACCOUNTANT,
  CARETAKER: ROLE_META.CARETAKER,
};

export const DIRECTORY_META = {
  staff: {
    label: "Staff Directory",
    shortLabel: "ST",
    description: "View and manage all staff members across organisation roles.",
    href: "/staff",
  },

  admin: {
    label: "Admin Directory",
    shortLabel: "AD",
    description:
      "Manage administrators with organisation-wide oversight and access.",
    href: "/staff/admin",
  },

  manager: {
    label: "Manager Directory",
    shortLabel: "MG",
    description:
      "Manage managers responsible for day-to-day organisation operations.",
    href: "/staff/manager",
  },

  office: {
    label: "Office Directory",
    shortLabel: "OF",
    description:
      "Manage office staff handling records, leases, tenants, and support.",
    href: "/staff/office",
  },

  accountant: {
    label: "Accountant Directory",
    shortLabel: "AC",
    description: "Manage accountants handling billing, payments, and reports.",
    href: "/staff/accountant",
  },

  caretaker: {
    label: "Caretaker Directory",
    shortLabel: "CT",
    description:
      "Manage caretakers assigned to operational and on-site responsibilities.",
    href: "/staff/caretaker",
  },

  tenant: {
    label: "Tenant Directory",
    shortLabel: "TN",
    description:
      "Access tenant records, occupancy details, and tenant management tools.",
    href: "/tenants",
  },
} as const;

export function isOrgRole(value: string): value is OrgRole {
  return (ORG_ROLES as readonly string[]).includes(value);
}

export function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

export function isTenantRole(value: string): value is TenantRole {
  return value === TENANT_ROLE;
}

export function normalizeOrgRole(value: string): OrgRole | null {
  const upper = value.trim().toUpperCase();

  return isOrgRole(upper) ? upper : null;
}

export function normalizeStaffRole(value: string): StaffRole | null {
  const upper = value.trim().toUpperCase();

  return isStaffRole(upper) ? upper : null;
}

export function normalizeTenantRole(value: string): TenantRole | null {
  const upper = value.trim().toUpperCase();

  return isTenantRole(upper) ? TENANT_ROLE : null;
}

export function getRoleMeta(role: OrgRole) {
  return ROLE_META[role];
}

export function getStaffRoleMeta(role: StaffRole) {
  return STAFF_ROLE_META[role];
}