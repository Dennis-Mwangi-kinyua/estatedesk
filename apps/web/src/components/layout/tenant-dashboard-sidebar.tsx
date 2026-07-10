"use client";

import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Home, X } from "lucide-react";
import { HoverPrefetchLink } from "@/components/navigation/app-links";
import { InAppHelpNav } from "@/components/help/in-app-help-nav";
import { LogoutButton } from "./org-sidebar-parts";
import {
  getTenantSidebarLinks,
  isTenantActivePath,
  type TenantSidebarLink,
} from "./tenant-sidebar-links";

type TenantDashboardSidebarProps = {
  organizationName: string;
  hasActiveLease: boolean;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
};

function TenantSidebarBrand({
  organizationName,
}: {
  organizationName: string;
}) {
  return (
    <HoverPrefetchLink href="/dashboard/tenant" className="flex items-center gap-3">
      <div className="ed-brand-mark flex h-10 w-10 items-center justify-center rounded-lg shadow-sm">
        <Home className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
          {organizationName}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Tenant portal</p>
      </div>
    </HoverPrefetchLink>
  );
}

function TenantSidebarNavItem({
  item,
  pathname,
  mobile = false,
  onNavigate,
}: {
  item: TenantSidebarLink;
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const active = isTenantActivePath(pathname, item.href);

  if (mobile) {
    return (
      <HoverPrefetchLink
        href={item.href}
        onClick={onNavigate}
        className={[
          "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors duration-150",
          active ? "ed-nav-item-active" : "ed-nav-item",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            active ? "ed-nav-icon-active" : "ed-nav-icon",
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
          <span className="truncate">{item.label}</span>
          <Icon
            className={
              active ? "h-4 w-4 text-white/80" : "h-4 w-4 text-current opacity-45"
            }
          />
        </div>
      </HoverPrefetchLink>
    );
  }

  return (
    <HoverPrefetchLink
      href={item.href}
      className={[
        "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
        active ? "ed-nav-item-active" : "ed-nav-item",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-9 w-9 items-center justify-center rounded-md",
          active ? "ed-nav-icon-active" : "ed-nav-icon",
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <span className="truncate">{item.label}</span>
        <Icon className={active ? "h-4 w-4 text-white/80" : "h-4 w-4 text-current opacity-45"} />
      </div>
    </HoverPrefetchLink>
  );
}

export function TenantDashboardSidebar({
  organizationName,
  hasActiveLease,
  mobileOpen,
  setMobileOpen,
}: TenantDashboardSidebarProps) {
  const pathname = usePathname();
  const visibleLinks = useMemo(
    () => getTenantSidebarLinks(hasActiveLease),
    [hasActiveLease],
  );

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, [setMobileOpen]);

  return (
    <>
      <aside className="ed-shell-panel fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r lg:flex">
        <div className="border-b border-slate-200 px-5 py-5 dark:border-white/10">
          <TenantSidebarBrand organizationName={organizationName} />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleLinks.map((item) => (
            <TenantSidebarNavItem
              key={item.href}
              item={item}
              pathname={pathname}
            />
          ))}
        </nav>

        <div className="space-y-2 p-4">
          <InAppHelpNav workspace="tenant" />
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
                  <TenantSidebarBrand organizationName={organizationName} />
                </div>

                <button
                  type="button"
                  onClick={closeMobile}
                  aria-label="Close navigation"
                  className="ios-button ed-soft-button touch-target inline-flex items-center justify-center border shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <nav className="ios-scroll min-h-0 flex-1 overflow-y-auto px-3 py-4 overscroll-contain">
              <div className="space-y-2 pb-2">
                {visibleLinks.map((item) => (
                  <TenantSidebarNavItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    mobile
                    onNavigate={closeMobile}
                  />
                ))}
              </div>
            </nav>

            <div className="shrink-0 space-y-2 border-t border-slate-200 p-4 dark:border-white/10">
              <InAppHelpNav workspace="tenant" compact />
              <LogoutButton mobile onClick={closeMobile} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}