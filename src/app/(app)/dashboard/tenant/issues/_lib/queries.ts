import { prisma } from "@/lib/prisma";
import {
  HISTORY_PAGE_SIZE,
  tenantIssuesArgs,
  type TenantIssue,
  type TenantIssuesPageData,
  type TenantIssuesResult,
} from "@/app/(app)/dashboard/tenant/issues/_lib/types";

export async function getTenantIssuesData(
  userId: string,
  orgId: string,
): Promise<TenantIssuesPageData | null> {
  const tenant: TenantIssuesResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantIssuesArgs,
  });

  const leaseUnits = tenant?.leases ?? [];
  const unitIds = Array.from(new Set(leaseUnits.map((lease) => lease.unitId)));

  if (!tenant || unitIds.length === 0) {
    return null;
  }

  const issues = await prisma.issueTicket.findMany({
    where: {
      orgId,
      unitId: {
        in: unitIds,
      },
    },
    orderBy: [{ createdAt: "desc" }],
    include: {
      property: true,
      unit: {
        include: {
          property: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      resolutionReports: {
        orderBy: {
          submittedAt: "desc",
        },
        take: 1,
        select: {
          id: true,
          status: true,
          workSummary: true,
          materialsUsed: true,
          tenantInstructions: true,
          officeNotes: true,
          submittedAt: true,
          officeReviewedAt: true,
        },
      },
      photoAsset: true,
    },
    take: 100,
  });

  if (issues.length === 0) {
    return null;
  }

  return {
    issues: issues as TenantIssue[],
    primaryUnit: leaseUnits[0]?.unit,
    totalIssues: issues.length,
    openIssues: issues.filter((issue) => issue.status === "OPEN").length,
    inProgressIssues: issues.filter(
      (issue) => issue.status === "IN_PROGRESS",
    ).length,
    resolvedIssues: issues.filter(
      (issue) => issue.status === "RESOLVED" || issue.status === "CLOSED",
    ).length,
    latestIssue: issues[0] ?? null,
    totalPages: Math.max(1, Math.ceil(issues.length / HISTORY_PAGE_SIZE)),
  };
}