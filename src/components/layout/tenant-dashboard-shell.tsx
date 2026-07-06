"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { TenantDashboardFooter } from "./tenant-dashboard-footer";
import { TenantDashboardHeader } from "./tenant-dashboard-header";
import { TenantDashboardSidebar } from "./tenant-dashboard-sidebar";

type TenantDashboardShellProps = {
  children: ReactNode;
  organizationName: string;
  userName: string;
  hasActiveLease: boolean;
  unreadNotificationCount?: number;
};

export function TenantDashboardShell({
  children,
  organizationName,
  userName,
  hasActiveLease,
  unreadNotificationCount = 0,
}: TenantDashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <TenantDashboardSidebar
        organizationName={organizationName}
        hasActiveLease={hasActiveLease}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <TenantDashboardHeader
        organizationName={organizationName}
        userName={userName}
        unreadNotificationCount={unreadNotificationCount}
        onMenuClick={() => setMobileOpen(true)}
      />

      <div className="lg:pl-72">
        <div className="flex min-h-screen flex-col pt-[76px] lg:pt-16">
          <main className="org-mobile-main-offset flex-1 px-3 py-3 sm:px-5 sm:py-4 lg:px-8 lg:pb-16">
            <div className="app-content-shell org-theme-content relative z-0 text-slate-950 dark:text-slate-100">
              {children}
            </div>
          </main>

          <div className="hidden px-4 pb-4 sm:px-6 lg:block lg:px-8">
            <div className="app-content-shell">
              <TenantDashboardFooter organizationName={organizationName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}