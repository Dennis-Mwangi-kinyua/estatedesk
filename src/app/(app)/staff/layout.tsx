import type { ReactNode } from "react";

import { OrgDashboardShell } from "@/components/layout/org-dashboard-shell";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type DashboardShellRole =
  | "ADMIN"
  | "MANAGER"
  | "OFFICE"
  | "ACCOUNTANT"
  | "CARETAKER";

function normalizeDashboardShellRole(
  role: string | null | undefined,
): DashboardShellRole {
  if (
    role === "ADMIN" ||
    role === "MANAGER" ||
    role === "OFFICE" ||
    role === "ACCOUNTANT" ||
    role === "CARETAKER"
  ) {
    return role;
  }

  // Prisma OrgRole may include LANDLORD or TENANT,
  // but OrgDashboardShell only accepts staff dashboard roles.
  if (role === "LANDLORD") {
    return "ADMIN";
  }

  return "ADMIN";
}

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
      role={normalizeDashboardShellRole(session.activeOrgRole)}
    >
      {children}
    </OrgDashboardShell>
  );
}