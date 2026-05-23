import type { ReactNode } from "react";
import { OrgDashboardShell } from "@/components/layout/org-dashboard-shell";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import { SubscriptionWarning } from "@/components/billing/subscription-warning";

export default async function OrgLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireManagementAccess();
  const access = await requireActiveSubscription(session.activeOrgId!);
  const shellRole =
    session.activeOrgRole === "ADMIN" ||
    session.activeOrgRole === "MANAGER" ||
    session.activeOrgRole === "OFFICE" ||
    session.activeOrgRole === "ACCOUNTANT"
      ? session.activeOrgRole
      : "ADMIN";

  return (
    <OrgDashboardShell
      organizationName="Estate Desk"
      userName="Admin User"
      userRole="Organization Admin"
      role={shellRole}
    >
      <SubscriptionWarning access={access} />
      {children}
    </OrgDashboardShell>
  );
}
