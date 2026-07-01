"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Home,
  LogOut,
  Menu,
  Receipt,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { HeaderThemeToggle } from "@/components/theme/theme-toggle";

type LandlordDashboardShellProps = {
  children: ReactNode;
  displayName: string;
  organizationName: string;
};

const navItems = [
  {
    label: "Overview",
    href: "/dashboard/landlord#overview",
    icon: Home,
  },
  {
    label: "Reports",
    href: "/dashboard/landlord#reports",
    icon: BarChart3,
  },
  {
    label: "Properties",
    href: "/dashboard/landlord#properties",
    icon: Building2,
  },
  {
    label: "Tenants",
    href: "/dashboard/landlord#tenants",
    icon: Users,
  },
  {
    label: "Security",
    href: "/dashboard/security",
    icon: ShieldCheck,
  },
] as const;

function LandlordNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState("#overview");

  useEffect(() => {
    const updateHash = () => setActiveHash(window.location.hash || "#overview");

    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  return (
    <nav className="space-y-2" aria-label="Landlord navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const itemHash = item.href.slice(item.href.indexOf("#"));
        const active =
          pathname === "/dashboard/landlord" && activeHash === itemHash;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={[
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "ed-nav-item-active"
                : "ed-nav-item",
            ].join(" ")}
          >
            <span
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                active
                  ? "ed-nav-icon-active"
                  : "ed-nav-icon",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function LandlordDashboardShell({
  children,
  displayName,
  organizationName,
}: LandlordDashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="app-mobile-canvas min-h-screen">
      <aside className="ed-shell-panel fixed inset-y-0 left-0 z-[100] hidden w-72 border-r p-4 lg:block">
        <Link href="/dashboard/landlord" className="flex items-center gap-3">
          <div className="ed-brand-mark flex h-10 w-10 items-center justify-center rounded-lg shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {organizationName}
            </p>
            <p className="text-xs text-slate-500">Landlord workspace</p>
          </div>
        </Link>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            Signed in as
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-950">
            {displayName}
          </p>
        </div>

        <div className="mt-6">
          <LandlordNav />
        </div>

        <form action={logoutAction} className="absolute inset-x-4 bottom-4">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-600">
              <LogOut className="h-4 w-4" />
            </span>
            Logout
          </button>
        </form>
      </aside>

      <header className="ed-shell-panel fixed left-0 right-0 top-0 z-[90] border-b lg:left-72">
        <div className="flex h-[72px] items-center justify-between gap-3 px-3 sm:px-6 lg:h-16 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="ios-button ed-soft-button flex h-11 w-11 shrink-0 items-center justify-center border shadow-sm lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
                Landlord Dashboard
              </h1>
              <p className="truncate text-xs text-slate-500 sm:text-sm">
                Monitor mapped properties, tenants, rent, and balances.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <HeaderThemeToggle />
            <div className="ed-soft-button hidden rounded-lg border px-3 py-2 text-right shadow-sm sm:block">
              <p className="max-w-[200px] truncate text-sm font-medium leading-none text-slate-950">
                {displayName}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Landlord</p>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="ed-shell-panel absolute inset-x-3 top-4 mx-auto max-h-[calc(100vh-2rem)] max-w-[430px] overflow-y-auto rounded-[28px] border p-4 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Menu
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Landlord workspace
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="ios-button ed-soft-button inline-flex h-11 w-11 items-center justify-center border shadow-sm"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="truncate text-sm font-semibold text-slate-950">
                {displayName}
              </p>
              <p className="mt-1 text-xs text-slate-500">{organizationName}</p>
            </div>

            <div className="mt-4">
              <LandlordNav onNavigate={() => setMobileOpen(false)} />
            </div>

            <form action={logoutAction} className="mt-4">
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-600">
                  <LogOut className="h-4 w-4" />
                </span>
                Logout
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <div className="flex min-h-screen flex-col pt-[72px] lg:pt-16">
          <main className="flex-1 px-3 py-3 pb-20 sm:px-5 sm:py-4 lg:px-8">
            <div className="app-content-shell">{children}</div>
          </main>

          <footer className="fixed bottom-0 left-0 right-0 z-[85] border-t border-white/60 bg-white/78 backdrop-blur-2xl lg:left-72">
            <div className="flex h-10 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <p className="truncate text-[11px] text-neutral-500">
                © {currentYear} {organizationName}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                <Receipt className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mapped portfolio reports</span>
                <span className="sm:hidden">Reports</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
