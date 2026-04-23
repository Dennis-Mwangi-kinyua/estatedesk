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
  Settings,
  ShieldCheck,
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
  emoji: string;
};

const SIDEBAR_LINKS: readonly SidebarLink[] = [
  {
    label: "Overview",
    href: "/dashboard/org",
    icon: Home,
    emoji: "🏠",
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"],
  },
  {
    label: "Properties",
    href: "/dashboard/org/properties",
    icon: Building,
    emoji: "🏘️",
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Buildings",
    href: "/dashboard/org/buildings",
    icon: Building2,
    emoji: "🏢",
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Units",
    href: "/dashboard/org/units",
    icon: Building2,
    emoji: "🚪",
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Tenants",
    href: "/dashboard/org/tenants",
    icon: Users,
    emoji: "🧑‍🤝‍🧑",
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Leases",
    href: "/dashboard/org/leases",
    icon: FileText,
    emoji: "📄",
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Payments",
    href: "/dashboard/org/payments",
    icon: CreditCard,
    emoji: "💳",
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Charges",
    href: "/dashboard/org/charges",
    icon: Receipt,
    emoji: "🧾",
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Issues",
    href: "/dashboard/org/issues",
    icon: Wrench,
    emoji: "🛠️",
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Staff",
    href: "/dashboard/org/staff",
    icon: Users,
    emoji: "👷",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Notifications",
    href: "/dashboard/org/notifications",
    icon: Bell,
    emoji: "🔔",
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Reports",
    href: "/dashboard/org/reports",
    icon: ShieldCheck,
    emoji: "📊",
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Taxes",
    href: "/dashboard/org/taxes",
    icon: Receipt,
    emoji: "🏛️",
    roles: ["ADMIN", "ACCOUNTANT"],
  },
  {
    label: "Settings",
    href: "/dashboard/org/settings",
    icon: Settings,
    emoji: "⚙️",
    roles: ["ADMIN"],
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
          "flex items-center gap-3 rounded-[22px] px-4 py-3.5 text-sm font-medium transition-all duration-200",
          active
            ? "bg-neutral-950 text-white shadow-sm"
            : "bg-white/80 text-neutral-800 hover:bg-neutral-50",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            active
              ? "bg-white/10 text-white"
              : "bg-neutral-100 text-neutral-700",
          ].join(" ")}
        >
          <span className="text-lg">{item.emoji}</span>
        </span>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate">{item.label}</span>
          <Icon
            className={
              active ? "h-4 w-4 text-white/80" : "h-4 w-4 text-neutral-400"
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
        "group flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-medium transition",
        active
          ? "bg-neutral-950 text-white shadow-sm"
          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-10 w-10 items-center justify-center rounded-2xl",
          active
            ? "bg-white/10 text-white"
            : "bg-neutral-100 text-neutral-700",
        ].join(" ")}
      >
        <span className="text-base">{item.emoji}</span>
      </span>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span className="truncate">{item.label}</span>
        <Icon
          className={active ? "h-4 w-4 text-white/80" : "h-4 w-4 text-neutral-400"}
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
      <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-neutral-950 text-white shadow-sm">
        <span className="text-xl">🏢</span>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-neutral-950">
          {organizationName}
        </p>
        <p className="text-xs text-neutral-500">Organization Workspace</p>
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
          "flex w-full items-center gap-3 rounded-[22px] text-sm font-medium transition",
          mobile
            ? "px-4 py-3.5 text-red-600 hover:bg-red-50 hover:text-red-700"
            : "px-4 py-3 text-red-600 hover:bg-red-50 hover:text-red-700",
        ].join(" ")}
      >
        <span
          className={[
            "flex items-center justify-center rounded-2xl bg-red-50 text-red-600",
            mobile ? "h-11 w-11 shrink-0" : "h-10 w-10",
          ].join(" ")}
        >
          <span className={mobile ? "text-lg" : "text-base"}>👋</span>
        </span>

        <span className="truncate">Logout</span>
        <LogOut className="ml-auto h-4 w-4 text-red-500" />
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-black/10 bg-white lg:flex">
        <div className="border-b border-black/10 px-6 py-6">
          <SidebarBrand organizationName={organizationName} />
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
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
            "absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out",
            mobileOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />

        <div
          className={[
            "absolute inset-y-0 left-0 flex w-[88%] max-w-[340px] flex-col rounded-r-[32px] border-r border-white/40 bg-white/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex h-full flex-col justify-between">
            <div className="min-h-0">
              <div className="flex items-center justify-between border-b border-black/5 px-4 pb-4 pt-5">
                <div className="min-w-0">
                  <SidebarBrand organizationName={organizationName} />
                </div>

                <button
                  type="button"
                  onClick={closeMobile}
                  aria-label="Close navigation"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-900 shadow-sm"
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
              <div className="rounded-[28px] bg-neutral-50 p-2 shadow-sm">
                <LogoutButton mobile onClick={closeMobile} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}