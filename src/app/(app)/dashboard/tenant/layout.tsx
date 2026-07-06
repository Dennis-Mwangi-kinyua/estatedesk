import { ReactNode } from "react";
import { TenantDashboardShell } from "@/components/layout/tenant-dashboard-shell";
import { getCurrentTenantShell } from "@/lib/tenant/get-current-tenant";
import { getTenantPortalContext } from "@/lib/tenant/get-tenant-portal-context";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import { SubscriptionWarning } from "@/components/billing/subscription-warning";
import { UnreadNotificationAlertsPanel } from "@/components/notifications/unread-notification-alerts-panel";

export const dynamic = "force-dynamic";

type TenantLayoutProps = {
  children: ReactNode;
};

export default async function TenantLayout({
  children,
}: TenantLayoutProps) {
  const tenant = await getCurrentTenantShell();

  if (!tenant) {
    return (
      <div className="org-theme-content mx-auto max-w-3xl p-6">
        <div className="ed-theme-card rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          No tenant profile is linked to your account.
        </div>
      </div>
    );
  }

  const session = await requireUserSession();
  const [activeLease, portalContext, access] = await Promise.all([
    prisma.lease.findFirst({
      where: {
        orgId: tenant.org.id,
        tenantId: tenant.id,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: {
        id: true,
      },
    }),
    getTenantPortalContext(session.userId, tenant.org.id),
    requireActiveSubscription(tenant.org.id),
  ]);
  const hasActiveLease = Boolean(activeLease);

  return (
    <TenantDashboardShell
      organizationName={tenant.org.name}
      userName={tenant.fullName}
      hasActiveLease={hasActiveLease}
      unreadNotificationCount={portalContext.unreadNotificationCount}
    >
      <SubscriptionWarning access={access} />
      <UnreadNotificationAlertsPanel
        audience="tenant"
        orgId={tenant.org.id}
        tenantId={tenant.id}
      />
      {children}
    </TenantDashboardShell>
  );
}