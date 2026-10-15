import { ProductUpdatesBanner } from "@/features/updates/banner";
import { getUnreadNotificationAlert } from "@/lib/notifications/unread-alert";
import type { ReactNode } from "react";
import { OrgDashboardShell } from "@/components/layout/org-dashboard-shell";
import { requireManagementAccess } from "@/lib/permissions/guards";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import { SubscriptionWarning } from "@/components/billing/subscription-warning";
import { getOrganizationSummary } from "@/lib/organizations/summary";
import { UnreadNotificationAlertsPanel } from "@/components/notifications/unread-notification-alerts-panel";
import {
  clearSupportSessionCookie,
  getActiveSupportSession,
} from "@/lib/platform/support-session";
import { setUserSession } from "@/lib/auth/session";

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
  const [access, organization, initialSupportSession, unread] = await Promise.all([
    requireActiveSubscription(session.activeOrgId!),
    getOrganizationSummary(session.activeOrgId!),
    getActiveSupportSession(session.userId),
    getUnreadNotificationAlert({ audience: "org_staff", orgId: session.activeOrgId!, userId: session.userId }).catch(() => null),
  ]);
  const shellRole =
    session.activeOrgRole === "ADMIN" ||
    session.activeOrgRole === "MANAGER" ||
    session.activeOrgRole === "OFFICE" ||
    session.activeOrgRole === "ACCOUNTANT"
      ? session.activeOrgRole
      : "ADMIN";
  const organizationName = organization?.name ?? "EstateDesk";
  const userRole = roleLabels[shellRole] ?? "Organization Staff";

  let supportSession = initialSupportSession;
  if (supportSession && supportSession.orgId !== session.activeOrgId) {
    supportSession = null;
  }
  // eslint-disable-next-line react-hooks/purity -- request-time session expiry check
  const requestUnix = Math.floor(Date.now() / 1000);
  if (supportSession && supportSession.expiresAtUnix <= requestUnix) {
    await clearSupportSessionCookie();
    await setUserSession({
      userId: session.userId,
      activeMembershipId: null,
      replaceExistingSessions: false,
    });
    supportSession = null;
  }

  return (
    <OrgDashboardShell
      unreadCount={unread?.count ?? 0}
      organizationName={organizationName}
      userName={session.fullName}
      userRole={userRole}
      role={shellRole}
      supportSession={
        supportSession
          ? {
              orgId: supportSession.orgId,
              orgSlug: supportSession.orgSlug,
              orgName: supportSession.orgName,
              reason: supportSession.reason,
              expiresAtUnix: supportSession.expiresAtUnix,
            }
          : null
      }
    >
      <SubscriptionWarning access={access} />
      <UnreadNotificationAlertsPanel
        audience="org_staff"
        orgId={session.activeOrgId!}
        userId={session.userId}
      />
      <ProductUpdatesBanner userId={session.userId} audience={session.activeOrgRole!} />
      {children}
    </OrgDashboardShell>
  );
}
