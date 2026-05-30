"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { OrgDashboardHeader } from "@/components/layout/org-dashboard-header";
import { OrgDashboardSidebar } from "@/components/layout/org-dashboard-sidebar";
import { OrgDashboardFooter } from "@/components/layout/org-dashboard-footer";
import type { OrgRole } from "@/components/layout/org-dashboard-sidebar";

type OrgDashboardShellProps = {
  children: ReactNode;
  organizationName: string;
  userName?: string;
  userRole?: string;
  role?: OrgRole;
};

export function OrgDashboardShell({
  children,
  organizationName,
  userName = "Admin User",
  userRole = "Organization Admin",
  role = "ADMIN",
}: OrgDashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-mobile-canvas min-h-screen">
      <OrgDashboardSidebar
        organizationName={organizationName}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        role={role}
      />

      <OrgDashboardHeader
        title={organizationName}
        subtitle={`${userRole} workspace`}
        onMenuClick={() => setMobileOpen(true)}
        userName={userName}
        userRole={userRole}
      />

      <div className="lg:pl-72">
        <div className="flex min-h-screen flex-col pt-[76px] lg:pt-16">
          <main className="mobile-bottom-safe flex-1 px-3 py-3 sm:px-5 sm:py-4 lg:px-8 lg:pb-16">
            <div className="app-content-shell">
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
