import type { ReactNode } from "react";
import { OrgDashboardShell } from "@/components/layout/org-dashboard-shell";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function StaffLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireUserSession();

  let organizationName = "Organisation";

  if (session.activeOrgId) {
    const organization = await prisma.organization.findUnique({
      where: { id: session.activeOrgId },
      select: { name: true },
    });

    if (organization?.name) {
      organizationName = organization.name;
    }
  }

  return (
    <OrgDashboardShell
      organizationName={organizationName}
      role={session.activeOrgRole ?? "ADMIN"}
    >
      {children}
    </OrgDashboardShell>
  );
}