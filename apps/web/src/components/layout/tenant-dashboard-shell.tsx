"use client";


import type { ReactNode } from "react";
import { useState } from "react";
import { TenantMobileNav } from "./tenant-mobile-nav";
import { TenantDashboardHeader } from "./tenant-dashboard-header";
import { TenantDashboardSidebar } from "./tenant-dashboard-sidebar";

type TenantDashboardShellProps = {
  children: ReactNode;
  organizationName: string;
  propertyName?: string;
  userName: string;
  hasActiveLease: boolean;
  hasVisitorAccess?: boolean;
  unreadNotificationCount?: number;
};

export function TenantDashboardShell({
  children,
  organizationName,
  propertyName,
  userName,
  hasActiveLease,
  hasVisitorAccess = false,
  unreadNotificationCount = 0,
}: TenantDashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div data-workspace="tenant" className="ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-clip">
      <TenantDashboardSidebar
        organizationName={organizationName}
        hasActiveLease={hasActiveLease}
        hasVisitorAccess={hasVisitorAccess}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <TenantDashboardHeader
        organizationName={propertyName || organizationName}
        userName={userName}
        unreadNotificationCount={unreadNotificationCount}
        onMenuClick={() => setMobileOpen(true)}
      />

      <TenantMobileNav menuOpen={mobileOpen} hasActiveLease={hasActiveLease} onMenuClick={() => setMobileOpen(true)} />

      <div className="lg:pl-72">
        <div className="flex min-h-[calc(100dvh-4.75rem)] flex-col">
          <main className="tenant-dashboard-main flex-1 px-3 pt-3 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-5 sm:pt-4 lg:px-8 lg:pb-16">
            <div className="app-content-shell org-theme-content relative z-0 w-full min-w-0 space-y-4 text-slate-950 sm:space-y-6 dark:text-slate-100">

              {children}
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
