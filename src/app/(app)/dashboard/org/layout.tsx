import type { ReactNode } from "react";
import { OrgDashboardShell } from "@/components/layout/org-dashboard-shell";

export default function OrgLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <OrgDashboardShell
      organizationName="Estate Desk"
      userName="Admin User"
      userRole="Organization Admin"
      role="ADMIN"
    >
      {children}
    </OrgDashboardShell>
  );
}