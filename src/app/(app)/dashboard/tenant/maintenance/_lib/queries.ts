import { prisma } from "@/lib/prisma";
import { HISTORY_PAGE_SIZE, tenantMaintenanceArgs } from "./types";
import type {
  MaintenanceIssue,
  TenantMaintenancePageData,
  TenantMaintenanceResult,
} from "./types";

export async function getTenantMaintenanceData(
  userId: string,
  orgId: string,
): Promise<TenantMaintenancePageData> {
  const tenant: TenantMaintenanceResult | null =
    await prisma.tenant.findFirst({
      where: {
        userId,
        orgId,
        deletedAt: null,
      },
      ...tenantMaintenanceArgs,
    });

  const activeLease = tenant?.leases?.[0] ?? null;
  const activeUnit = activeLease?.unit ?? null;
  const unitId = activeLease?.unitId;

  const issues: MaintenanceIssue[] = unitId
    ? await prisma.issueTicket.findMany({
        where: {
          orgId,
          unitId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              fullName: true,
            },
          },
          property: true,
          photoAsset: true,
        },
        take: 100,
      })
    : [];

  const totalIssues = issues.length;
  const openIssues = issues.filter((issue) => issue.status === "OPEN").length;
  const inProgressIssues = issues.filter(
    (issue) => issue.status === "IN_PROGRESS",
  ).length;
  const resolvedIssues = issues.filter(
    (issue) => issue.status === "RESOLVED" || issue.status === "CLOSED",
  ).length;

  return {
    activeUnit,
    issues,
    totalIssues,
    openIssues,
    inProgressIssues,
    resolvedIssues,
    latestIssue: issues[0] ?? null,
    totalPages: Math.max(1, Math.ceil(issues.length / HISTORY_PAGE_SIZE)),
  };
}