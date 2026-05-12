"use client";

import Link from "next/link";
import { memo, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building,
  Building2,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Receipt,
  Send,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { logoutAction } from "@/features/auth/actions/logout-action";

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

const SIDEBAR_LINKS: readonly SidebarLink[] = [
  {
    label: "Overview",
    href: "/dashboard/org",
    icon: Home,
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"],
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
    label: "Support",
    href: "/dashboard/org/support",
    icon: Send,
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
] as const;

type OrgDashboardSidebarProps = {
  organizationName: string;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  role?: OrgRole;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard/org") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarNavItemProps = {
  item: SidebarLink;
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
};

const SidebarNavItem = memo(function SidebarNavItem({
  item,
  pathname,
  mobile = false,
  onNavigate,
}: SidebarNavItemProps) {
  const Icon = item.icon;
  const active = isActivePath(pathname, item.href);

  if (mobile) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={[
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            active
              ? "bg-white/12 text-white"
              : "bg-slate-100 text-slate-600",
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate">{item.label}</span>
          <Icon
            className={
            active ? "h-4 w-4 text-white/80" : "h-4 w-4 text-slate-400"
            }
          />
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={[
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-9 w-9 items-center justify-center rounded-md",
          active
            ? "bg-white/12 text-white"
            : "bg-slate-100 text-slate-600",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span className="truncate">{item.label}</span>
        <Icon
          className={active ? "h-4 w-4 text-white/80" : "h-4 w-4 text-slate-400"}
        />
      </div>
    </Link>
  );
});

const SidebarBrand = memo(function SidebarBrand({
  organizationName,
}: {
  organizationName: string;
}) {
  return (
    <Link href="/dashboard/org" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Building2 className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950">
          {organizationName}
        </p>
        <p className="text-xs text-slate-500">Organization workspace</p>
      </div>
    </Link>
  );
});

const LogoutButton = memo(function LogoutButton({
  mobile = false,
  onClick,
}: {
  mobile?: boolean;
  onClick?: () => void;
}) {
  return (
    <form action={logoutAction} onSubmit={onClick}>
      <button
        type="submit"
        className={[
          "flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-colors",
          mobile
            ? "px-4 py-3.5 text-red-600 hover:bg-red-50 hover:text-red-700"
            : "px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700",
        ].join(" ")}
      >
        <span
          className={[
            "flex items-center justify-center rounded-md bg-red-50 text-red-600",
            mobile ? "h-9 w-9 shrink-0" : "h-9 w-9",
          ].join(" ")}
        >
          <LogOut className="h-4 w-4" />
        </span>

        <span className="truncate">Logout</span>
      </button>
    </form>
  );
});

export function OrgDashboardSidebar({
  organizationName,
  mobileOpen,
  setMobileOpen,
  role = "ADMIN",
}: OrgDashboardSidebarProps) {
  const pathname = usePathname();

  const visibleLinks = useMemo(() => {
    return SIDEBAR_LINKS.filter((item) => item.roles.includes(role));
  }, [role]);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, [setMobileOpen]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200 bg-white shadow-[10px_0_28px_rgba(15,23,42,0.04)] lg:flex">
        <div className="border-b border-slate-200 px-5 py-5">
          <SidebarBrand organizationName={organizationName} />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleLinks.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              pathname={pathname}
            />
          ))}
        </nav>

        <div className="p-4">
          <LogoutButton />
        </div>
      </aside>

      <div
        className={[
          "fixed inset-0 z-40 lg:hidden transition-all duration-300 ease-out",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={closeMobile}
          className={[
            "absolute inset-0 bg-slate-950/35 backdrop-blur-sm transition-opacity duration-300 ease-out",
            mobileOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        <div
          className={[
            "absolute inset-y-0 left-0 flex w-[88%] max-w-[360px] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-full flex-col justify-between">
            <div className="min-h-0">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 pb-4 pt-5">
                <div className="min-w-0">
                  <SidebarBrand organizationName={organizationName} />
                </div>

                <button
                  type="button"
                  onClick={closeMobile}
                  aria-label="Close navigation"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-900 shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="overflow-y-auto px-3 py-4">
                <div className="space-y-2">
                  {visibleLinks.map((item) => (
                    <SidebarNavItem
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      mobile
                      onNavigate={closeMobile}
                    />
                  ))}
                </div>
              </nav>
            </div>

            <div className="px-3 pb-4 pt-3 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
              <div className="rounded-lg bg-slate-50 p-2">
                <LogoutButton mobile onClick={closeMobile} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
