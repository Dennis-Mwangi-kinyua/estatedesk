import type { StaffRole } from "@/features/staff/constants/role-meta";

export const ROLE_DIRECTORY_WORKFLOW = [
  {
    step: "01",
    title: "Review roster",
    description: "See who is active, online, and assigned within this role.",
  },
  {
    step: "02",
    title: "Open profiles",
    description: "Manage member details, access, and caretaker assignments.",
  },
  {
    step: "03",
    title: "Add members",
    description: "Onboard new staff into this directory from the same workspace.",
  },
] as const;

type RoleGuidanceItem = {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
};

const SHARED_GUIDANCE: RoleGuidanceItem[] = [
  {
    title: "Staff directory",
    description: "Return to the full roster across every organisation role.",
    href: "/staff",
    actionLabel: "Open staff directory",
  },
  {
    title: "Organization settings",
    description: "Review memberships, API keys, and access policies.",
    href: "/dashboard/org/settings",
    actionLabel: "Open settings",
  },
];

const ROLE_GUIDANCE: Record<StaffRole, RoleGuidanceItem[]> = {
  ADMIN: [
    {
      title: "Security controls",
      description: "Review organisation security settings and access policies.",
      href: "/dashboard/org/security",
      actionLabel: "Open security",
    },
    ...SHARED_GUIDANCE,
  ],
  MANAGER: [
    {
      title: "Operations desk",
      description: "Managers coordinate issues, inspections, and tenant follow-up.",
      href: "/dashboard/org/issues",
      actionLabel: "Open issues",
    },
    ...SHARED_GUIDANCE,
  ],
  OFFICE: [
    {
      title: "Tenant records",
      description: "Office staff maintain leases, tenants, and support records.",
      href: "/dashboard/org/tenants",
      actionLabel: "Open tenants",
    },
    ...SHARED_GUIDANCE,
  ],
  ACCOUNTANT: [
    {
      title: "Payments desk",
      description: "Accountants review collections, balances, and reconciliation.",
      href: "/dashboard/org/payments",
      actionLabel: "Open payments",
    },
    ...SHARED_GUIDANCE,
  ],
  CARETAKER: [
    {
      title: "Add caretaker",
      description: "Assign a property or apartment/block before capturing profile details.",
      href: "/staff/caretaker/new",
      actionLabel: "Add caretaker",
    },
    {
      title: "Field inspections",
      description: "Caretakers work from mapped properties and apartment scopes.",
      href: "/dashboard/org/inspections",
      actionLabel: "Open inspections",
    },
    {
      title: "Maintenance issues",
      description: "Track caretaker follow-up from the issues desk.",
      href: "/dashboard/org/issues",
      actionLabel: "Open issues",
    },
    ...SHARED_GUIDANCE,
  ],
};

export function getRoleDirectoryGuidance(role: StaffRole) {
  return ROLE_GUIDANCE[role];
}