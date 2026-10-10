"use client";


import type { ReactNode } from "react";
import { useState } from "react";
import { OrgDashboardHeader } from "@/components/layout/org-dashboard-header";
import { OrgDashboardSidebar } from "@/components/layout/org-dashboard-sidebar";
import { OrgDashboardFooter } from "@/components/layout/org-dashboard-footer";
import type { OrgRole } from "@/components/layout/org-dashboard-sidebar";
import {
  SupportSessionBanner,
  type SupportSessionBannerData,
} from "@/components/layout/support-session-banner";

type OrgDashboardShellProps = {
  children: ReactNode;
  unreadCount?: number;
  organizationName: string;
  userName?: string;
  userRole?: string;
  role?: OrgRole;
  supportSession?: SupportSessionBannerData | null;
};

export function OrgDashboardShell({
  children,
  unreadCount = 0,
  organizationName,
  userName = "Admin User",
  userRole = "Organization Admin",
  role = "ADMIN",
  supportSession = null,
}: OrgDashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div data-workspace="org" className="ed-mobile-surface min-h-dvh w-full min-w-0 overflow-x-clip">
      <OrgDashboardSidebar
        organizationName={organizationName}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        role={role}
      />

      <OrgDashboardHeader
        unreadCount={unreadCount}
        title={organizationName}
        subtitle={`${userRole} workspace`}
        onMenuClick={() => setMobileOpen(true)}
        userName={userName}
        userRole={userRole}
      />

      <div className="lg:pl-72">
        <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
          {supportSession ? <SupportSessionBanner session={supportSession} /> : null}
          <main className="org-mobile-main-offset flex-1 px-3 py-3 sm:px-5 sm:py-4 lg:px-8 lg:pb-16">
            <div className="app-content-shell org-theme-content relative z-0 w-full min-w-0 space-y-4 text-slate-950 sm:space-y-6 dark:text-slate-100">

              {children}
            </div>
          </main>

          <div className="hidden px-4 pb-4 sm:px-6 lg:block lg:px-8">
            <div className="app-content-shell">
              <OrgDashboardFooter organizationName={organizationName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
