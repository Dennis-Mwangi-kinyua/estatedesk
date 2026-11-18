import { getTenantVisitorAccess } from "@/features/visitors/availability";
import { ProductUpdatesBanner } from "@/features/updates/banner";
import { ReactNode } from "react";
import { TenantDashboardShell } from "@/components/layout/tenant-dashboard-shell";
import { getCurrentTenantShell } from "@/lib/tenant/get-current-tenant";
import { getTenantUnreadNotificationCount } from "@/lib/tenant/get-tenant-portal-context";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  getSubscriptionAccessState,
  type SubscriptionAccessState,
} from "@/lib/billing/subscription-access";
import { SubscriptionWarning } from "@/components/billing/subscription-warning";
import { UnreadNotificationAlertsPanel } from "@/components/notifications/unread-notification-alerts-panel";
import { redirect } from "next/navigation";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";

export const dynamic = "force-dynamic";

type TenantLayoutProps = {
  children: ReactNode;
};

function isNextRedirectError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  return String((error as { digest?: string }).digest ?? "").startsWith("NEXT_REDIRECT");
}

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

  const [activeLeaseResult, unreadResult, accessResult] = await Promise.allSettled([
    retryTransientDatabaseOperation(
      () =>
        prisma.lease.findFirst({
          where: {
            orgId: tenant.org.id,
            tenantId: tenant.id,
            status: "ACTIVE",
            deletedAt: null,
          },
          select: { id: true, unit: { select: { property: { select: { name: true } } } } },
        }),
      { label: "tenant-layout-active-lease" },
    ),
    getTenantUnreadNotificationCount(tenant.org.id, tenant.id, session.userId),
    getSubscriptionAccessState(tenant.org.id),
  ]);

  if (activeLeaseResult.status === "rejected") {
    console.warn("[TenantLayout] activeLease lookup failed", activeLeaseResult.reason);
  }
  if (unreadResult.status === "rejected") {
    console.warn("[TenantLayout] unread notification count failed", unreadResult.reason);
  }
  if (accessResult.status === "rejected") {
    if (isNextRedirectError(accessResult.reason)) throw accessResult.reason;
    console.warn("[TenantLayout] subscription access failed", accessResult.reason);
  }

  const activeLease =
    activeLeaseResult.status === "fulfilled" ? activeLeaseResult.value : null;
  const access: SubscriptionAccessState | null =
    accessResult.status === "fulfilled" ? accessResult.value : null;

  // Only hard-block when we successfully loaded a blocked subscription state.
  if (access?.status === "blocked") {
    redirect("/dashboard/billing-required");
  }

  const hasVisitorAccess = Boolean(activeLease) && await getTenantVisitorAccess(tenant.org.id, session.userId).catch(() => false);

  return (
    <TenantDashboardShell
      organizationName={tenant.org.name}
      propertyName={activeLease?.unit.property.name}
      userName={tenant.fullName}
      hasActiveLease={Boolean(activeLease)}
      hasVisitorAccess={hasVisitorAccess}
      unreadNotificationCount={unreadResult.status === "fulfilled" ? unreadResult.value : 0}
    >
      {access ? <SubscriptionWarning access={access} /> : null}
      <UnreadNotificationAlertsPanel
        audience="tenant"
        orgId={tenant.org.id}
        tenantId={tenant.id}
        userId={session.userId}
      />
      <ProductUpdatesBanner userId={session.userId} audience={"TENANT"} />
      {children}
    </TenantDashboardShell>
  );
}