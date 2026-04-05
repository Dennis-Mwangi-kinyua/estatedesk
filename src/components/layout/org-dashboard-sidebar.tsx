"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  FileBarChart2,
  Home,
  LogOut,
  Settings,
  Users,
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
  icon: ComponentType<{ className?: string }>;
  roles: OrgRole[];
};

const sidebarLinks: SidebarLink[] = [
  {
    label: "Overview",
    href: "/dashboard/org",
    icon: Home,
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"],
  },
  {
    label: "Properties",
    href: "/properties",
    icon: Building2,
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Staff",
    href: "/staff",
    icon: Users,
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Tenants",
    href: "/tenants",
    icon: Users,
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileBarChart2,
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

type OrgDashboardSidebarProps = {
  role?: OrgRole;
  organizationName: string;
};

export function OrgDashboardSidebar({
  role = "ADMIN",
  organizationName,
}: OrgDashboardSidebarProps) {
  const pathname = usePathname();

  const visibleLinks = sidebarLinks.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden border-r border-black/10 bg-white lg:flex lg:w-72 lg:flex-col">
      <div className="border-b border-black/10 px-6 py-5">
        <Link href="/dashboard/org" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white">
            <Building2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{organizationName}</p>
            <p className="text-xs text-neutral-500">Registered Organisation</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {visibleLinks.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-black/10 p-4">
        <Link
          href="/logout"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}