import { ReactNode } from "react";
import { getCurrentTenantShell } from "@/lib/tenant/get-current-tenant";
import { prisma } from "@/lib/prisma";
import { TenantHeader } from "./tenant-header";
import { TenantSidebar } from "./tenant-sidebar";
import { TenantFooter } from "./tenant-footer";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import { SubscriptionWarning } from "@/components/billing/subscription-warning";

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
      <div className="p-6">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          No tenant profile is linked to your account.
        </div>
      </div>
    );
  }

  const activeLease = await prisma.lease.findFirst({
    where: {
      orgId: tenant.org.id,
      tenantId: tenant.id,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });
  const access = await requireActiveSubscription(tenant.org.id);
  const hasActiveLease = Boolean(activeLease);

  return (
    <div className="app-mobile-canvas min-h-screen">
      <TenantSidebar fullName={tenant.fullName} hasActiveLease={hasActiveLease} />
      <TenantHeader
        fullName={tenant.fullName}
        orgName={tenant.org.name}
        hasActiveLease={hasActiveLease}
      />
      <TenantFooter />

      <div className="min-h-screen lg:pl-[300px] xl:pl-[320px]">
        <main className="px-3 pb-32 pt-[104px] sm:px-5 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="app-content-shell">
            <SubscriptionWarning access={access} />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
