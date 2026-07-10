import { requireManagementAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import { getCachedOrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { getVacancyInquiryAlerts } from "@/features/dashboard/server/get-vacancy-inquiry-alerts";
import { OrgDashboardWorkspace } from "./_components/org-dashboard-workspace";

export const dynamic = "force-dynamic";

export default async function OrganizationDashboardPage() {
  const session = await requireManagementAccess();

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const [data, vacancyInquiries, organization] = await Promise.all([
    getCachedOrgDashboardSummary(session.activeOrgId),
    getVacancyInquiryAlerts(session.activeOrgId),
    prisma.organization.findUnique({
      where: { id: session.activeOrgId },
      select: { name: true },
    }),
  ]);

  return (
    <OrgDashboardWorkspace
      initialData={data}
      initialVacancyInquiries={vacancyInquiries}
      organizationName={organization?.name ?? "Organisation"}
      orgId={session.activeOrgId}
      orgRole={session.activeOrgRole}
      interval={30_000}
    />
  );
}