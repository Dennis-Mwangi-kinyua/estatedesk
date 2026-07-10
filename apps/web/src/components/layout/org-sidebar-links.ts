import {
  Bell,
  BellRing,
  Building,
  Building2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Droplets,
  FileText,
  Home,
  Lightbulb,
  Landmark,
  Inbox,
  LogOut,
  Receipt,
  Send,
  Settings,
  ShieldCheck,
  Upload,
  UserCheck,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";

export type OrgRole =
  | "ADMIN"
  | "MANAGER"
  | "OFFICE"
  | "ACCOUNTANT"
  | "CARETAKER"
  | "TENANT";

type SidebarLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: readonly OrgRole[];
};

export const SIDEBAR_LINKS: readonly SidebarLink[] = [
  {
    label: "Overview",
    href: "/dashboard/org",
    icon: Home,
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"],
  },
  {
    label: "Smart Insights",
    href: "/dashboard/org/insights",
    icon: Lightbulb,
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "My Profile",
    href: "/dashboard/org/profile",
    icon: UserRound,
    roles: ["MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Properties",
    href: "/dashboard/org/properties",
    icon: Building,
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Buildings",
    href: "/dashboard/org/buildings",
    icon: Building2,
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Units",
    href: "/dashboard/org/units",
    icon: Building2,
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Tenants",
    href: "/dashboard/org/tenants",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Verify Tenant",
    href: "/dashboard/org/verify-tenant",
    icon: UserCheck,
    roles: ["ADMIN"],
  },
  {
    label: "Leases",
    href: "/dashboard/org/leases",
    icon: FileText,
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Payments",
    href: "/dashboard/org/payments",
    icon: CreditCard,
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Accounting",
    href: "/dashboard/org/accounting",
    icon: Landmark,
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Vacancy inquiries",
    href: "/dashboard/org/vacancy-inquiries",
    icon: BellRing,
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Finance requests",
    href: "/dashboard/org/finance-requests",
    icon: Inbox,
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Accounting requests",
    href: "/dashboard/org/accounting/requests",
    icon: ClipboardList,
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Move-outs",
    href: "/dashboard/org/move-outs",
    icon: LogOut,
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Inspections",
    href: "/dashboard/org/inspections",
    icon: ClipboardCheck,
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Water bills",
    href: "/dashboard/org/water-bills",
    icon: Droplets,
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Expenditures",
    href: "/dashboard/org/expenditures",
    icon: Receipt,
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Charges",
    href: "/dashboard/org/charges",
    icon: Receipt,
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Issues",
    href: "/dashboard/org/issues",
    icon: Wrench,
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Completion reports",
    href: "/dashboard/org/issues/resolution-reports",
    icon: ClipboardList,
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Staff",
    href: "/dashboard/org/staff",
    icon: Users,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Notifications",
    href: "/dashboard/org/notifications",
    icon: Bell,
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Reports",
    href: "/dashboard/org/reports",
    icon: ShieldCheck,
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Imports",
    href: "/dashboard/org/imports",
    icon: Upload,
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Taxes",
    href: "/dashboard/org/taxes",
    icon: Receipt,
    roles: ["ADMIN", "ACCOUNTANT"],
  },
  {
    label: "Settings",
    href: "/dashboard/org/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    label: "Security",
    href: "/dashboard/org/security",
    icon: ShieldCheck,
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Support",
    href: "/dashboard/org/support",
    icon: Send,
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
] as const;

export type { SidebarLink };

export function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard/org") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}