import type { ReactNode } from "react";
import { OrgDashboardShell } from "@/components/layout/org-dashboard-shell";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function PropertiesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireUserSession();

  let organizationName = "Organization";

  if (session.activeOrgId) {
    const org = await prisma.organization.findUnique({
      where: {
        id: session.activeOrgId,
      },
      select: {
        name: true,
      },
    });

    if (org?.name) {
      organizationName = org.name;
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