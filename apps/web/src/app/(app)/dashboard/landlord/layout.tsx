import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SubscriptionWarning } from "@/components/billing/subscription-warning";
import { LandlordDashboardShell } from "@/components/layout/landlord-dashboard-shell";
import { requireUserSession } from "@/lib/auth/session";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LandlordLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    redirect("/login");
  }

  if (session.activeOrgRole !== "LANDLORD") {
    redirect("/dashboard");
  }

  const [access, profile, org] = await Promise.all([
    requireActiveSubscription(session.activeOrgId),
    prisma.landlordProfile.findFirst({
      where: {
        orgId: session.activeOrgId,
        userId: session.userId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        displayName: true,
      },
    }),
    prisma.organization.findUnique({
      where: { id: session.activeOrgId },
      select: { name: true },
    }),
  ]);

  return (
    <LandlordDashboardShell
      displayName={profile?.displayName ?? session.fullName}
      organizationName={org?.name ?? "EstateDesk"}
    >
      <SubscriptionWarning access={access} />
      {children}
    </LandlordDashboardShell>
  );
}
