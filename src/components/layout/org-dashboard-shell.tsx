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
    <div className="h-dvh overflow-hidden bg-neutral-50">
      <OrgDashboardSidebar
        organizationName={organizationName}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        role={role}
      />

      <div className="lg:pl-72">
        <OrgDashboardHeader
          onMenuClick={() => setMobileOpen(true)}
          userName={userName}
          userRole={userRole}
        />

        <main className="fixed inset-x-0 bottom-10 top-16 overflow-y-auto px-4 py-4 sm:px-6 lg:left-72 lg:right-0 lg:px-8">
          {children}
        </main>

        <OrgDashboardFooter organizationName={organizationName} />
      </div>
    </div>
  );
}