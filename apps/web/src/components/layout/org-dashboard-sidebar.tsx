"use client";

import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { InAppHelpNav } from "@/components/help/in-app-help-nav";
import {
  SIDEBAR_LINKS,
  type OrgRole,
} from "./org-sidebar-links";
import {
  LogoutButton,
  SidebarBrand,
  SidebarNavItem,
} from "./org-sidebar-parts";

export type { OrgRole } from "./org-sidebar-links";

type OrgDashboardSidebarProps = {
  organizationName: string;
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  role?: OrgRole;
};

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
      <aside className="ed-shell-panel fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r lg:flex">
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

        <div className="space-y-2 p-4">
          <InAppHelpNav workspace="org" orgRole={role} />
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
                  className="ios-button ed-soft-button touch-target inline-flex items-center justify-center border shadow-sm"
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
              <div className="space-y-2 rounded-2xl bg-slate-50 p-2 dark:bg-slate-900">
                <InAppHelpNav workspace="org" orgRole={role} compact />
                <LogoutButton mobile onClick={closeMobile} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}