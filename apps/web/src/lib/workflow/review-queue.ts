import "server-only";
import type { AppSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";

export type ReviewItem = { id: string; title: string; detail: string; status: string; since: Date; href: string };
export type ReviewGroup = { id: string; title: string; total: number; owner: string; nextAction: string; href: string; nativePath: string; items: ReviewItem[] };
export function waitingAge(since: Date, now = new Date()) {
  const minutes = Math.max(0, Math.floor((now.getTime() - since.getTime()) / 60000));
  return minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${Math.floor(minutes / 60)} hr` : `${Math.floor(minutes / 1440)} days`;
}

/** Each category returns the oldest 25; totals always count the entire authorized queue. */
export async function getReviewQueue(session: AppSession, kind: "platform" | "organization"): Promise<ReviewGroup[]> {
  if (session.mustChangePassword || session.requiresTermsAcceptance) return [];
  const orderBy = [{ createdAt: "asc" as const }, { id: "asc" as const }];
  const take = 25;
  if (kind === "platform") {
    if (!["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole)) return [];
    const providerWhere = { status: "PENDING" as const };
    const reportWhere = { resolvedAt: null };
    const exportWhere = { status: "PENDING" as const };
    const [providers, providerCount, reports, reportCount, exports, exportCount] = await Promise.all([
      prisma.serviceProvider.findMany({ where: providerWhere, orderBy, take, select: { id: true, businessName: true, category: true, createdAt: true } }),
      prisma.serviceProvider.count({ where: providerWhere }),
      prisma.providerReport.findMany({ where: reportWhere, orderBy, take, select: { id: true, reason: true, createdAt: true, provider: { select: { businessName: true } }, org: { select: { name: true } } } }),
      prisma.providerReport.count({ where: reportWhere }),
      prisma.dataExportRequest.findMany({ where: exportWhere, orderBy, take, select: { id: true, createdAt: true, org: { select: { name: true } } } }),
      prisma.dataExportRequest.count({ where: exportWhere }),
    ]);
    return [
      { id: "applications", title: "Provider applications", total: providerCount, owner: "Platform reviewers", nextAction: "Review the application and approve, request corrections or decline.", href: "/platform/service-providers?status=PENDING", nativePath: "/platform/service-providers", items: providers.map(row => ({ id: row.id, title: row.businessName, detail: row.category, status: "PENDING", since: row.createdAt, href: `/platform/service-providers?status=PENDING#provider-${row.id}` })) },
      { id: "reports", title: "Provider reports", total: reportCount, owner: "Platform reviewers", nextAction: "Investigate the report and record a resolution.", href: "/platform/service-providers#reports", nativePath: "/platform/service-providers/reports", items: reports.map(row => ({ id: row.id, title: row.provider.businessName, detail: `${row.org.name} · ${row.reason}`, status: "OPEN", since: row.createdAt, href: `/platform/service-providers#report-${row.id}` })) },
      { id: "exports", title: "Export approvals", total: exportCount, owner: "Platform administrators", nextAction: "Review the request scope and approve or reject the export.", href: "/platform/data-management", nativePath: "/platform/data-management", items: exports.map(row => ({ id: row.id, title: row.org.name, detail: "Data export request", status: "PENDING", since: row.createdAt, href: "/platform/data-management" })) },
    ];
  }
  if (!session.activeOrgId || !canAccessWorkspacePath(session, "/dashboard/org/service-providers")) return [];
  const orgId = session.activeOrgId;
  const applicationWhere = { status: { in: ["PENDING", "REVIEWING"] as ("PENDING" | "REVIEWING")[] }, job: { orgId, status: "OPEN" as const } };
  const jobWhere = { orgId, status: "SUBMITTED" as const };
  const paymentWhere = { status: "DISPUTED" as const, job: { orgId, paymentTracking: true } };
  const [applications, applicationCount, jobs, jobCount, payments, paymentCount] = await Promise.all([
    prisma.jobApplication.findMany({ where: applicationWhere, orderBy, take, select: { id: true, createdAt: true, status: true, job: { select: { id: true, title: true } }, provider: { select: { businessName: true } } } }),
    prisma.jobApplication.count({ where: applicationWhere }),
    prisma.serviceJob.findMany({ where: jobWhere, orderBy: [{ updatedAt: "asc" }, { id: "asc" }], take, select: { id: true, title: true, updatedAt: true, provider: { select: { businessName: true } } } }),
    prisma.serviceJob.count({ where: jobWhere }),
    prisma.providerJobPayment.findMany({ where: paymentWhere, orderBy, take, select: { id: true, updatedAt: true, amount: true, job: { select: { id: true, title: true } } } }),
    prisma.providerJobPayment.count({ where: paymentWhere }),
  ]);
  const base = "/dashboard/org/service-providers";
  return [
    { id: "applications", title: "Job applications", total: applicationCount, owner: "Organization hiring team", nextAction: "Review the proposal and shortlist, decline or send an offer.", href: `${base}?workflow=applications#jobs`, nativePath: base, items: applications.map(row => ({ id: row.id, title: row.job.title, detail: row.provider.businessName, status: row.status, since: row.createdAt, href: `${base}#job-${row.job.id}` })) },
    { id: "completion", title: "Work awaiting confirmation", total: jobCount, owner: "Organization hiring team", nextAction: "Check the completed work and confirm it or request a correction.", href: `${base}?workflow=completion#jobs`, nativePath: base, items: jobs.map(row => ({ id: row.id, title: row.title, detail: row.provider?.businessName ?? "Provider", status: "SUBMITTED", since: row.updatedAt, href: `${base}#job-${row.id}` })) },
    { id: "payments", title: "Payment queries", total: paymentCount, owner: "Organization finance team", nextAction: "Check the payment evidence and resolve the provider’s query.", href: `${base}?workflow=payments#jobs`, nativePath: base, items: payments.map(row => ({ id: row.id, title: row.job.title, detail: `KES ${row.amount.toString()}`, status: "DISPUTED", since: row.updatedAt, href: `${base}#job-${row.job.id}` })) },
  ];
}
