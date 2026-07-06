import { prisma } from "@/lib/prisma";
import { getErrorMessage } from "./helpers";
import {
  tenantIssueReportArgs,
  type ReportIssuePageData,
  type TenantIssueReportResult,
} from "./types";

export async function getReportIssuePageData(
  userId: string,
  orgId: string,
  searchParams: {
    error?: string;
    title?: string;
    description?: string;
  },
): Promise<{ data: ReportIssuePageData; tenant: TenantIssueReportResult } | null> {
  const tenant: TenantIssueReportResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantIssueReportArgs,
  });

  if (!tenant) {
    return null;
  }

  const leaseUnits = tenant.leases
    .map((lease) => lease.unit)
    .filter((unit, index, arr) => arr.findIndex((u) => u.id === unit.id) === index);

  return {
    tenant,
    data: {
      leaseUnits,
      errorMessage: getErrorMessage(searchParams.error),
      sharedTitle: searchParams.title?.slice(0, 120) ?? "",
      sharedDescription: searchParams.description?.slice(0, 2000) ?? "",
    },
  };
}