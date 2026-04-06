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
    redirect("/login?error=missing_org_context");
  }

  if (
    session.activeOrgRole !== "ADMIN" &&
    session.activeOrgRole !== "MANAGER" &&
    session.activeOrgRole !== "OFFICE" &&
    session.activeOrgRole !== "ACCOUNTANT" &&
    session.activeOrgRole !== "CARETAKER"
  ) {
    redirect("/login?error=invalid_org_role");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      org: {
        deletedAt: null,
      },
      user: {
        deletedAt: null,
      },
    },
    include: {
      org: true,
    },
  });

  if (!membership?.org) {
    redirect("/login?error=org_access_not_found");
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