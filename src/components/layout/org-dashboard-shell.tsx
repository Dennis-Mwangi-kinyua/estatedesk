import type { ReactNode } from "react";
import { OrgDashboardHeader } from "@/components/layout/org-dashboard-header";
import { OrgDashboardSidebar } from "@/components/layout/org-dashboard-sidebar";
import { OrgDashboardFooter } from "@/components/layout/org-dashboard-footer";
import type { OrgRole } from "@/components/layout/org-dashboard-sidebar";

type OrgDashboardShellProps = {
  children: ReactNode;
  organizationName: string;
  role?: OrgRole;
};

export function OrgDashboardShell({
  children,
  organizationName,
  role = "ADMIN",
}: OrgDashboardShellProps) {
  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-950">
      <div className="grid min-h-dvh lg:grid-cols-[260px_1fr]">
        <OrgDashboardSidebar
          role={role}
          organizationName={organizationName}
        />

        <div className="flex min-h-dvh flex-col">
          <OrgDashboardHeader />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          <OrgDashboardFooter organizationName={organizationName} />
        </div>
      </div>
    </div>
  );
}