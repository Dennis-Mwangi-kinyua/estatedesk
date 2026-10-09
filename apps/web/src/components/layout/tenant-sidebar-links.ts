import { workspaceIconFor } from "@/components/shared/workspace-icon";
import type { SidebarLink } from "./org-sidebar-links";

export type TenantSidebarLink = SidebarLink & {
  requiresActiveLease?: boolean;
};

export const TENANT_SIDEBAR_LINKS: readonly TenantSidebarLink[] = [
  {
    label: "Overview",
    href: "/dashboard/tenant",
    icon: workspaceIconFor("/dashboard/tenant"),
    roles: ["TENANT"],
    requiresActiveLease: false,
  },
  {
    label: "Profile",
    href: "/dashboard/tenant/profile",
    icon: workspaceIconFor("/dashboard/tenant/profile"),
    roles: ["TENANT"],
    requiresActiveLease: false,
  },
  {
    label: "Security",
    href: "/dashboard/security",
    icon: workspaceIconFor("/dashboard/security"),
    roles: ["TENANT"],
    requiresActiveLease: false,
  },
  {
    label: "Lease",
    href: "/dashboard/tenant/lease",
    icon: workspaceIconFor("/dashboard/tenant/lease"),
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Payments",
    href: "/dashboard/tenant/payments",
    icon: workspaceIconFor("/dashboard/tenant/payments"),
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "RentRewards",
    href: "/dashboard/tenant/rewards",
    icon: workspaceIconFor("/dashboard/tenant/rewards"),
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Invoices",
    href: "/dashboard/tenant/invoice",
    icon: workspaceIconFor("/dashboard/tenant/invoice"),
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Expenditures",
    href: "/dashboard/tenant/expenditures",
    icon: workspaceIconFor("/dashboard/tenant/expenditures"),
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Water Bills",
    href: "/dashboard/tenant/water-bills",
    icon: workspaceIconFor("/dashboard/tenant/water-bills"),
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Maintenance & repairs",
    href: "/dashboard/tenant/issues",
    icon: workspaceIconFor("/dashboard/tenant/issues"),
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Inspections",
    href: "/dashboard/tenant/inspections",
    icon: workspaceIconFor("/dashboard/tenant/inspections"),
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Notices",
    href: "/dashboard/tenant/notices",
    icon: workspaceIconFor("/dashboard/tenant/notices"),
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Notifications",
    href: "/dashboard/tenant/notifications",
    icon: workspaceIconFor("/dashboard/tenant/notifications"),
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Documents",
    href: "/dashboard/tenant/documents",
    icon: workspaceIconFor("/dashboard/tenant/documents"),
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
] as const;

export function getTenantSidebarLinks(hasActiveLease: boolean) {
  return TENANT_SIDEBAR_LINKS.filter(
    (item) => hasActiveLease || !item.requiresActiveLease,
  );
}

export function isTenantActivePath(pathname: string, href: string) {
  if (href === "/dashboard/tenant") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}