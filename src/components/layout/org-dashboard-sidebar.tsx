"use client";

import Link from "next/link";
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
  roles: OrgRole[];
  emoji: string;
};

const sidebarLinks: SidebarLink[] = [
  {
    label: "Overview",
    href: "/dashboard/org",
    icon: Home,
    emoji: "🏠",
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"],
  },
  {
    label: "Properties",
    href: "/properties",
    icon: Building,
    emoji: "🏘️",
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Buildings",
    href: "/buildings",
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
    href: "/leases",
    icon: FileText,
    emoji: "📄",
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Payments",
    href: "/payments",
    icon: CreditCard,
    emoji: "💳",
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Charges",
    href: "/charges",
    icon: Receipt,
    emoji: "🧾",
    roles: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
  },
  {
    label: "Issues",
    href: "/issues",
    icon: Wrench,
    emoji: "🛠️",
    roles: ["ADMIN", "MANAGER", "OFFICE", "CARETAKER"],
  },
  {
    label: "Staff",
    href: "/staff",
    icon: Users,
    emoji: "👷",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    emoji: "🔔",
    roles: ["ADMIN", "MANAGER", "OFFICE"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: ShieldCheck,
    emoji: "📊",
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Taxes",
    href: "/taxes",
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
];

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

export function OrgDashboardSidebar({
  organizationName,
  mobileOpen,
  setMobileOpen,
  role = "ADMIN",
}: OrgDashboardSidebarProps) {
  const pathname = usePathname();
  const visibleLinks = sidebarLinks.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-[95] hidden w-72 flex-col border-r border-black/10 bg-white lg:flex">
        <div className="border-b border-black/10 px-6 py-6">
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
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          {visibleLinks.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.label}
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
                    className={
                      active
                        ? "h-4 w-4 text-white/80"
                        : "h-4 w-4 text-neutral-400"
                    }
                  />
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <Link
            href="/logout"
            className="flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <span className="text-base">👋</span>
            </span>
            <span>Logout</span>
            <LogOut className="ml-auto h-4 w-4 text-red-500" />
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <div
        className={[
          "fixed inset-0 z-[100] lg:hidden transition-all duration-300 ease-out",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
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
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-neutral-950 text-white shadow-sm">
                    <span className="text-xl">🏢</span>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-neutral-950">
                      {organizationName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Organization Workspace
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-900 shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="overflow-y-auto px-3 py-4">
                <div className="space-y-2">
                  {visibleLinks.map((item) => {
                    const active = isActivePath(pathname, item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
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
                              active
                                ? "h-4 w-4 text-white/80"
                                : "h-4 w-4 text-neutral-400"
                            }
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </nav>
            </div>

            <div className="px-3 pb-4 pt-3 [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
              <div className="rounded-[28px] bg-neutral-50 p-2 shadow-sm">
                <Link
                  href="/logout"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-[22px] px-4 py-3.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <span className="text-lg">👋</span>
                  </span>
                  <span className="truncate">Logout</span>
                  <LogOut className="ml-auto h-4 w-4 text-red-500" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}