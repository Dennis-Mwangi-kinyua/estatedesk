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
  LayoutGrid,
  LogOut,
  Receipt,
  Send,
  Settings,
  ShieldCheck,
  UserRound,
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
          "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors duration-150",
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            active
              ? "bg-white/12 text-white"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate">{item.label}</span>
          <Icon
            className={
            active ? "h-4 w-4 text-white/80" : "h-4 w-4 text-slate-400 dark:text-slate-500"
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
        "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-9 w-9 items-center justify-center rounded-md",
          active
            ? "bg-white/12 text-white"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span className="truncate">{item.label}</span>
        <Icon className={active ? "h-4 w-4 text-white/80" : "h-4 w-4 text-slate-400 dark:text-slate-500"} />
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
        <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
          {organizationName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Organization workspace</p>
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
            ? "px-4 py-3.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10"
            : "px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10",
        ].join(" ")}
      >
        <span
          className={[
            "flex items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300",
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200 bg-white/92 shadow-[10px_0_28px_rgba(15,23,42,0.04)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/88 lg:flex">
        <div className="border-b border-slate-200 px-5 py-5 dark:border-white/10">
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
          "fixed inset-0 z-[120] lg:hidden transition-all duration-300 ease-out",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={closeMobile}
          className={[
            "absolute inset-0 bg-slate-950/42 backdrop-blur-md transition-opacity duration-300 ease-out",
            mobileOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        <div
          className={[
            "absolute inset-y-0 left-0 flex w-[90%] max-w-[390px] flex-col border-r border-slate-200 bg-white/86 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out dark:border-white/10 dark:bg-slate-950/86",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 pb-4 pt-safe dark:border-white/10">
                <div className="min-w-0">
                  <SidebarBrand organizationName={organizationName} />
                </div>

                <button
                  type="button"
                  onClick={closeMobile}
                  aria-label="Close navigation"
                  className="ios-button touch-target inline-flex items-center justify-center border border-slate-200 bg-white/86 text-slate-900 shadow-sm dark:border-white/10 dark:bg-slate-900/86 dark:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <nav className="ios-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4 overscroll-contain">
              <div className="space-y-2 pb-2">
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

            <div className="shrink-0 border-t border-slate-200/80 px-3 pb-4 pt-3 [padding-bottom:max(1rem,env(safe-area-inset-bottom))] dark:border-white/10">
              <div className="rounded-2xl bg-slate-50 p-2 dark:bg-slate-900">
                <LogoutButton mobile onClick={closeMobile} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className="fixed bottom-3 left-3 right-3 z-[88] rounded-[28px] border border-slate-200/75 bg-white/82 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_18px_44px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/82 lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {[
            ...visibleLinks.slice(0, 4),
            {
              label: "More",
              href: "#menu",
              icon: LayoutGrid,
              roles: [] as const,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isMore = item.href === "#menu";
            const active = !isMore && isActivePath(pathname, item.href);

            if (isMore) {
              return (
                <button
                  key="more"
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-slate-500 transition active:scale-95 dark:text-slate-400"
                >
                  <Icon className="h-5 w-5" />
                  <span>More</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition active:scale-95",
                  active
                    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900",
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
