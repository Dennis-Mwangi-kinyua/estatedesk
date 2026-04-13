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
    <div className="min-h-screen bg-neutral-50">
      <OrgDashboardSidebar
        organizationName={organizationName}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        role={role}
      />

      <OrgDashboardHeader
        onMenuClick={() => setMobileOpen(true)}
        userName={userName}
        userRole={userRole}
      />

      <div className="lg:pl-72">
        <div className="flex min-h-screen flex-col pt-16">
          <main className="flex-1 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
            <div className="mx-auto w-full max-w-[1440px]">
              {children}
            </div>
          </main>

          <div className="px-4 pb-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1440px]">
              <OrgDashboardFooter organizationName={organizationName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}