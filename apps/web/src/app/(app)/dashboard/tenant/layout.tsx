import { ReactNode } from "react";
import { TenantDashboardShell } from "@/components/layout/tenant-dashboard-shell";
import { getCurrentTenantShell } from "@/lib/tenant/get-current-tenant";
import { getTenantPortalContext } from "@/lib/tenant/get-tenant-portal-context";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  getSubscriptionAccessState,
  type SubscriptionAccessState,
} from "@/lib/billing/subscription-access";
import { SubscriptionWarning } from "@/components/billing/subscription-warning";
import { UnreadNotificationAlertsPanel } from "@/components/notifications/unread-notification-alerts-panel";
import { emptyPaymentInstructions } from "@/lib/payments/instructions";
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

  const emptyPortal: Awaited<ReturnType<typeof getTenantPortalContext>> = {
    tenant: null,
    paymentHealth: null,
    paymentInstructions: emptyPaymentInstructions,
    unreadNotificationCount: 0,
    pendingLeaseSignatures: [],
    caretakerContact: null,
    leaseDocuments: [],
  };

  const [activeLeaseResult, portalResult, accessResult] = await Promise.allSettled([
    retryTransientDatabaseOperation(
      () =>
        prisma.lease.findFirst({
          where: {
            orgId: tenant.org.id,
            tenantId: tenant.id,
            status: "ACTIVE",
            deletedAt: null,
          },
          select: { id: true },
        }),
      { label: "tenant-layout-active-lease" },
    ),
    getTenantPortalContext(session.userId, tenant.org.id),
    getSubscriptionAccessState(tenant.org.id),
  ]);

  if (activeLeaseResult.status === "rejected") {
    console.warn("[TenantLayout] activeLease lookup failed", activeLeaseResult.reason);
  }
  if (portalResult.status === "rejected") {
    console.warn("[TenantLayout] portal context failed", portalResult.reason);
  }
  if (accessResult.status === "rejected") {
    if (isNextRedirectError(accessResult.reason)) throw accessResult.reason;
    console.warn("[TenantLayout] subscription access failed", accessResult.reason);
  }

  const activeLease =
    activeLeaseResult.status === "fulfilled" ? activeLeaseResult.value : null;
  const portalContext =
    portalResult.status === "fulfilled" ? portalResult.value : emptyPortal;

  const access: SubscriptionAccessState | null =
    accessResult.status === "fulfilled" ? accessResult.value : null;

  // Only hard-block when we successfully loaded a blocked subscription state.
  if (access?.status === "blocked") {
    redirect("/dashboard/billing-required");
  }

  return (
    <TenantDashboardShell
      organizationName={tenant.org.name}
      userName={tenant.fullName}
      hasActiveLease={Boolean(activeLease)}
      unreadNotificationCount={portalContext.unreadNotificationCount}
    >
      {access ? <SubscriptionWarning access={access} /> : null}
      <UnreadNotificationAlertsPanel
        audience="tenant"
        orgId={tenant.org.id}
        tenantId={tenant.id}
      />
      {children}
    </TenantDashboardShell>
  );
}