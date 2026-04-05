import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { OrgDashboardShell } from "@/components/layout/org-dashboard-shell";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

export default async function OrgDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    redirect("/onboarding");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
    },
    include: {
      org: true,
    },
  });

  if (!membership?.org) {
    redirect("/onboarding");
  }

  return (
    <OrgDashboardShell
      organizationName={membership.org.name}
      role={membership.role}
    >
      {children}
    </OrgDashboardShell>
  );
}