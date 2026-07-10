import { prisma } from "@/lib/prisma";
import {
  tenantLeaseArgs,
  type TenantLeasePageData,
  type TenantLeaseResult,
} from "./types";

export async function getTenantLeaseData(
  userId: string,
  orgId: string,
): Promise<TenantLeasePageData> {
  const tenant: TenantLeaseResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantLeaseArgs,
  });

  const activeLeases =
    tenant?.leases.filter((lease) => lease.status === "ACTIVE") ?? [];
  const historicalLeases =
    tenant?.leases.filter((lease) => lease.status !== "ACTIVE") ?? [];
  const latestLease = activeLeases[0] ?? tenant?.leases?.[0] ?? null;

  return {
    tenant,
    activeLeases,
    historicalLeases,
    latestLease,
  };
}