import { requireManagementAccess } from "@/lib/permissions/guards";
import { logServerError } from "@/lib/errors/server-error-log";
import { prisma } from "@/lib/prisma";
import { getCachedOrgDashboardSummary } from "@/features/dashboard/server/get-org-dashboard-summary";
import { getVacancyInquiryAlerts } from "@/features/dashboard/server/get-vacancy-inquiry-alerts";
import { OrgDashboardWorkspace } from "./_components/org-dashboard-workspace";
import { mobileWorkspaceLinks } from "@/lib/mobile/workspace-menu";
import { scopedIssueWhere, scopedUnitWhere } from "@/lib/permissions/record-scope";
import Link from "@/components/navigation/workspace-link";

export const dynamic = "force-dynamic";

export default async function OrganizationDashboardPage() {
  const session = await requireManagementAccess();

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const orgId = session.activeOrgId;

  if (session.membershipScope?.scopeType !== "ORG") {
    const unitWhere = scopedUnitWhere(orgId, session.membershipScope);
    const [unitCount, activeLeaseCount, openIssueCount, organization] = await Promise.all([
      prisma.unit.count({ where: unitWhere }),
      prisma.lease.count({ where: { orgId, deletedAt: null, status: "ACTIVE", unit: unitWhere } }),
      prisma.issueTicket.count({ where: { ...scopedIssueWhere(orgId, session.membershipScope), status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.organization.findUnique({ where: { id: orgId }, select: { name: true } }),
    ]);
    return <main className="space-y-6 p-4 sm:p-6"><header><p className="text-sm text-muted-foreground">Assigned workspace</p><h1 className="text-3xl font-semibold">{organization?.name ?? "Organisation"}</h1><p className="mt-2 text-muted-foreground">Summary for your assigned properties and units.</p></header><section className="grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Assigned units</p><p className="mt-2 text-3xl font-semibold">{unitCount}</p></article><article className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Active leases</p><p className="mt-2 text-3xl font-semibold">{activeLeaseCount}</p></article><article className="rounded-2xl border bg-card p-5"><p className="text-sm text-muted-foreground">Open issues</p><p className="mt-2 text-3xl font-semibold">{openIssueCount}</p></article></section><Link href="/dashboard/org/units" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 font-medium text-primary-foreground">Open assigned units</Link></main>;
  }

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
      featureLinks={mobileWorkspaceLinks(session, "organization")}
      initialData={dataResult.value}
      initialVacancyInquiries={vacancyInquiries}
      organizationName={organizationName}
      orgId={orgId}
      orgRole={session.activeOrgRole}
      interval={30_000}
    />
  );
}
