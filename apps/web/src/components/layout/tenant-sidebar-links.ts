import {
  Bell,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Droplets,
  FileText,
  FolderOpen,
  Gift,
  Home,
  Receipt,
  ShieldCheck,
  UserRound,
  Wallet,
  Wrench,
} from "lucide-react";
import type { SidebarLink } from "./org-sidebar-links";

export type TenantSidebarLink = SidebarLink & {
  requiresActiveLease?: boolean;
};

export const TENANT_SIDEBAR_LINKS: readonly TenantSidebarLink[] = [
  {
    label: "Overview",
    href: "/dashboard/tenant",
    icon: Home,
    roles: ["TENANT"],
    requiresActiveLease: false,
  },
  {
    label: "Profile",
    href: "/dashboard/tenant/profile",
    icon: UserRound,
    roles: ["TENANT"],
    requiresActiveLease: false,
  },
  {
    label: "Security",
    href: "/dashboard/security",
    icon: ShieldCheck,
    roles: ["TENANT"],
    requiresActiveLease: false,
  },
  {
    label: "Lease",
    href: "/dashboard/tenant/lease",
    icon: FileText,
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Payments",
    href: "/dashboard/tenant/payments",
    icon: CreditCard,
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "RentRewards",
    href: "/dashboard/tenant/rewards",
    icon: Gift,
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Invoices",
    href: "/dashboard/tenant/invoice",
    icon: Receipt,
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Expenditures",
    href: "/dashboard/tenant/expenditures",
    icon: Wallet,
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Water Bills",
    href: "/dashboard/tenant/water-bills",
    icon: Droplets,
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Maintenance & repairs",
    href: "/dashboard/tenant/issues",
    icon: Wrench,
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Inspections",
    href: "/dashboard/tenant/inspections",
    icon: CalendarDays,
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Notices",
    href: "/dashboard/tenant/notices",
    icon: Bell,
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Notifications",
    href: "/dashboard/tenant/notifications",
    icon: ClipboardList,
    roles: ["TENANT"],
    requiresActiveLease: true,
  },
  {
    label: "Documents",
    href: "/dashboard/tenant/documents",
    icon: FolderOpen,
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