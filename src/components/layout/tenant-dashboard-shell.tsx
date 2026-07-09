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
    <div className="ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-hidden">
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
        <div className="flex min-h-dvh flex-col pt-[calc(4.75rem+env(safe-area-inset-top))] lg:pt-16">
          <main className="org-mobile-main-offset flex-1 px-3 py-3 sm:px-5 sm:py-4 lg:px-8 lg:pb-16">
            <div className="app-content-shell org-theme-content relative z-0 w-full min-w-0 space-y-4 text-slate-950 sm:space-y-6 dark:text-slate-100">
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