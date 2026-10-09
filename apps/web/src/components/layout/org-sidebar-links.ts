import { workspaceIconFor } from "@/components/shared/workspace-icon";
import { ORG_WORKSPACE_ROLES } from "@/lib/permissions/workspace-access";

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
    icon: workspaceIconFor("/dashboard/org"),
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"],
  },
  {
    label: "Smart Insights",
    href: "/dashboard/org/insights",
    icon: workspaceIconFor("/dashboard/org/insights"),
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "My Profile",
    href: "/dashboard/org/profile",
    icon: workspaceIconFor("/dashboard/org/profile"),
    roles: ["MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Properties",
    href: "/dashboard/org/properties",
    icon: workspaceIconFor("/dashboard/org/properties"),
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Airbnb",
    href: "/dashboard/org/airbnb",
    icon: workspaceIconFor("/dashboard/org/airbnb"),
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Buildings",
    href: "/dashboard/org/buildings",
    icon: workspaceIconFor("/dashboard/org/buildings"),
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Units",
    href: "/dashboard/org/units",
    icon: workspaceIconFor("/dashboard/org/units"),
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Tenants",
    href: "/dashboard/org/tenants",
    icon: workspaceIconFor("/dashboard/org/tenants"),
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Verify Tenant",
    href: "/dashboard/org/verify-tenant",
    icon: workspaceIconFor("/dashboard/org/verify-tenant"),
    roles: ["ADMIN"],
  },
  {
    label: "Leases",
    href: "/dashboard/org/leases",
    icon: workspaceIconFor("/dashboard/org/leases"),
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Payments",
    href: "/dashboard/org/payments",
    icon: workspaceIconFor("/dashboard/org/payments"),
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Accounting",
    href: "/dashboard/org/accounting",
    icon: workspaceIconFor("/dashboard/org/accounting"),
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Vacancy inquiries",
    href: "/dashboard/org/vacancy-inquiries",
    icon: workspaceIconFor("/dashboard/org/vacancy-inquiries"),
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Finance requests",
    href: "/dashboard/org/finance-requests",
    icon: workspaceIconFor("/dashboard/org/finance-requests"),
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Accounting requests",
    href: "/dashboard/org/accounting/requests",
    icon: workspaceIconFor("/dashboard/org/accounting/requests"),
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Move-outs",
    href: "/dashboard/org/move-outs",
    icon: workspaceIconFor("/dashboard/org/move-outs"),
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Inspections",
    href: "/dashboard/org/inspections",
    icon: workspaceIconFor("/dashboard/org/inspections"),
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Water bills",
    href: "/dashboard/org/water-bills",
    icon: workspaceIconFor("/dashboard/org/water-bills"),
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Expenditures",
    href: "/dashboard/org/expenditures",
    icon: workspaceIconFor("/dashboard/org/expenditures"),
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Charges",
    href: "/dashboard/org/charges",
    icon: workspaceIconFor("/dashboard/org/charges"),
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Issues",
    href: "/dashboard/org/issues",
    icon: workspaceIconFor("/dashboard/org/issues"),
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Completion reports",
    href: "/dashboard/org/issues/resolution-reports",
    icon: workspaceIconFor("/dashboard/org/issues/resolution-reports"),
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Staff",
    href: "/dashboard/org/staff",
    icon: workspaceIconFor("/dashboard/org/staff"),
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Notifications",
    href: "/dashboard/org/notifications",
    icon: workspaceIconFor("/dashboard/org/notifications"),
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Reports",
    href: "/dashboard/org/reports",
    icon: workspaceIconFor("/dashboard/org/reports"),
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Imports",
    href: "/dashboard/org/imports",
    icon: workspaceIconFor("/dashboard/org/imports"),
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Taxes",
    href: "/dashboard/org/taxes",
    icon: workspaceIconFor("/dashboard/org/taxes"),
    roles: ["ADMIN", "ACCOUNTANT"],
  },
  {
    label: "Settings",
    href: "/dashboard/org/settings",
    icon: workspaceIconFor("/dashboard/org/settings"),
    roles: ["ADMIN"],
  },
  {
    label: "Security",
    href: "/dashboard/org/security",
    icon: workspaceIconFor("/dashboard/org/security"),
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Support",
    href: "/dashboard/org/support",
    icon: workspaceIconFor("/dashboard/org/support"),
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
].map((item) => ({
  ...item,
  roles: (ORG_WORKSPACE_ROLES[item.href.split("/")[3]] ?? ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"]) as readonly OrgRole[],
}));

export type { SidebarLink };

export function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard/org") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
export function sidebarGroup(href: string) {
  const path = href.split("/")[3] ?? "";
  if (["properties", "airbnb", "buildings", "units", "tenants", "verify-tenant", "leases", "vacancy-inquiries", "imports"].includes(path)) return "Portfolio";
  if (["payments", "accounting", "finance-requests", "water-bills", "expenditures", "charges", "taxes", "reports"].includes(path)) return "Finance";
  if (["move-outs", "inspections", "issues"].includes(path)) return "Operations";
  if (["staff", "notifications", "settings", "security", "support", "profile"].includes(path)) return "Administration";
  return "Overview";
}
export const SIDEBAR_GROUPS = ["Overview", "Portfolio", "Finance", "Operations", "Administration"];
