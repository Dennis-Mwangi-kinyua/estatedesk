import type { ReactNode } from "react";
import { getOrganizationSummary } from "@/lib/organizations/summary";
import { requireOrgRole } from "@/lib/permissions/guards";
import { OrgDashboardShell } from "@/components/layout/org-dashboard-shell";
import { CaretakerDashboardShell } from "@/components/layout/caretaker-dashboard-shell";

export default async function GateLayout({ children }: { children: ReactNode }) {
  const session = await requireOrgRole(["ADMIN", "MANAGER", "OFFICE", "CARETAKER", "SECURITY"]);
  if (session.activeOrgRole === "CARETAKER") {
    return <CaretakerDashboardShell fullName={session.fullName}>{children}</CaretakerDashboardShell>;
  }
  const organization = await getOrganizationSummary(session.activeOrgId!);
  const role = session.activeOrgRole as "ADMIN" | "MANAGER" | "OFFICE" | "SECURITY";
  const labels = { ADMIN: "Organization Admin", MANAGER: "Manager", OFFICE: "Office Staff", SECURITY: "Security" };
  return <OrgDashboardShell organizationName={organization?.name ?? "EstateDesk"} userName={session.fullName} userRole={labels[role]} role={role}>{children}</OrgDashboardShell>;
}
