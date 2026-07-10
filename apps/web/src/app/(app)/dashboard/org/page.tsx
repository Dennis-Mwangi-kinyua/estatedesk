import { requireManagementAccess } from "@/lib/permissions/guards";
import { logServerError } from "@/lib/errors/server-error-log";
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

  const orgId = session.activeOrgId;

  const [dataResult, vacancyResult, organizationResult] =
    await Promise.allSettled([
      getCachedOrgDashboardSummary(orgId),
      getVacancyInquiryAlerts(orgId),
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
      }),
    ]);

  if (dataResult.status === "rejected") {
    logServerError("org.dashboard.summary", dataResult.reason, { orgId });
    throw dataResult.reason;
  }

  if (vacancyResult.status === "rejected") {
    logServerError("org.dashboard.vacancyInquiries", vacancyResult.reason, {
      orgId,
    });
  }

  if (organizationResult.status === "rejected") {
    logServerError("org.dashboard.organization", organizationResult.reason, {
      orgId,
    });
  }

  const organizationName =
    organizationResult.status === "fulfilled"
      ? (organizationResult.value?.name ?? "Organisation")
      : "Organisation";

  const vacancyInquiries =
    vacancyResult.status === "fulfilled" ? vacancyResult.value : [];

  return (
    <OrgDashboardWorkspace
      initialData={dataResult.value}
      initialVacancyInquiries={vacancyInquiries}
      organizationName={organizationName}
      orgId={orgId}
      orgRole={session.activeOrgRole}
      interval={30_000}
    />
  );
}
