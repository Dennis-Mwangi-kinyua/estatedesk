import type { ReactNode } from "react";
import { OrgDashboardShell } from "@/components/layout/org-dashboard-shell";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import { SubscriptionWarning } from "@/components/billing/subscription-warning";
import { prisma } from "@/lib/prisma";
import { UnreadNotificationAlertsPanel } from "@/components/notifications/unread-notification-alerts-panel";

const roleLabels: Record<string, string> = {
  ADMIN: "Organization Admin",
  MANAGER: "Manager",
  OFFICE: "Office Staff",
  ACCOUNTANT: "Accountant",
};

export default async function OrgLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireManagementAccess();
  const access = await requireActiveSubscription(session.activeOrgId!);
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId!,
      employmentEndedAt: null,
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
    },
    select: {
      role: true,
      org: {
        select: {
          name: true,
        },
      },
    },
  });
  const shellRole =
    session.activeOrgRole === "ADMIN" ||
    session.activeOrgRole === "MANAGER" ||
    session.activeOrgRole === "OFFICE" ||
    session.activeOrgRole === "ACCOUNTANT"
      ? session.activeOrgRole
      : "ADMIN";
  const organizationName = membership?.org.name ?? "EstateDesk";
  const userRole = roleLabels[membership?.role ?? shellRole] ?? "Organization Staff";

  return (
    <OrgDashboardShell
      organizationName={organizationName}
      userName={session.fullName}
      userRole={userRole}
      role={shellRole}
    >
      <SubscriptionWarning access={access} />
      <UnreadNotificationAlertsPanel
        audience="org_staff"
        orgId={session.activeOrgId!}
        userId={session.userId}
      />
      {children}
    </OrgDashboardShell>
  );
}
