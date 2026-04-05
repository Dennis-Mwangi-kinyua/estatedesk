export const STAFF_ROLES = [
  "ADMIN",
  "MANAGER",
  "OFFICE",
  "ACCOUNTANT",
  "CARETAKER",
  "TENANT",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_META: Record<
  StaffRole,
  {
    label: string;
    emoji: string;
    description: string;
    badgeClass: string;
    cardClass: string;
  }
> = {
  ADMIN: {
    label: "Admin",
    emoji: "👑",
    description: "Full organisation control",
    badgeClass: "border-violet-200 bg-violet-100 text-violet-800",
    cardClass: "from-violet-50 to-white",
  },
  MANAGER: {
    label: "Manager",
    emoji: "📋",
    description: "Operations and supervision",
    badgeClass: "border-sky-200 bg-sky-100 text-sky-800",
    cardClass: "from-sky-50 to-white",
  },
  OFFICE: {
    label: "Office",
    emoji: "🗂️",
    description: "Office and support workflow",
    badgeClass: "border-slate-200 bg-slate-100 text-slate-800",
    cardClass: "from-slate-50 to-white",
  },
  ACCOUNTANT: {
    label: "Accountant",
    emoji: "💰",
    description: "Finance and rent records",
    badgeClass: "border-emerald-200 bg-emerald-100 text-emerald-800",
    cardClass: "from-emerald-50 to-white",
  },
  CARETAKER: {
    label: "Caretaker",
    emoji: "🛠️",
    description: "Property support and maintenance",
    badgeClass: "border-amber-200 bg-amber-100 text-amber-800",
    cardClass: "from-amber-50 to-white",
  },
  TENANT: {
    label: "Tenant",
    emoji: "🏠",
    description: "Residents linked to this organisation",
    badgeClass: "border-rose-200 bg-rose-100 text-rose-800",
    cardClass: "from-rose-50 to-white",
  },
};

export function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLES.includes(value as StaffRole);
}

export function normalizeStaffRole(value: string): StaffRole | null {
  const upper = value.toUpperCase();
  return isStaffRole(upper) ? upper : null;
}