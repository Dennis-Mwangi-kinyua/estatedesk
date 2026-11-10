import "server-only";

import { prisma } from "@/lib/prisma";
import { computeSaasMetrics, type SaasMetrics } from "@/lib/workflow/saas-metrics";

const CHARGE_SAMPLE = 500;

export async function loadSaasMetrics(orgId: string, now = new Date()): Promise<SaasMetrics | null> {
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { createdAt: true },
  });
  if (!organization) return null;

  const [firstUnit, firstCharge, paymentGroups, charges] = await Promise.all([
    prisma.unit.findFirst({
      where: { deletedAt: null, property: { orgId, deletedAt: null } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { createdAt: true },
    }),
    prisma.rentCharge.findFirst({
      where: { orgId, chargeType: "RENT" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { createdAt: true },
    }),
    prisma.payment.groupBy({
      by: ["method", "verificationStatus", "gatewayStatus"],
      where: { orgId, reversedAt: null },
      _count: { _all: true },
    }),
    prisma.rentCharge.findMany({
      where: { orgId, chargeType: "RENT" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: CHARGE_SAMPLE,
      select: { createdAt: true, updatedAt: true, balance: true, status: true },
    }),
  ]);

  return computeSaasMetrics({
    organizationCreatedAt: organization.createdAt,
    firstUnitAt: firstUnit?.createdAt ?? null,
    firstChargeAt: firstCharge?.createdAt ?? null,
    payments: paymentGroups.map((bucket) => ({
      method: bucket.method,
      verificationStatus: bucket.verificationStatus,
      gatewayStatus: bucket.gatewayStatus,
      count: bucket._count._all,
    })),
    charges: charges.map((charge) => ({
      createdAt: charge.createdAt,
      updatedAt: charge.updatedAt,
      balance: Number(charge.balance),
      status: charge.status,
    })),
    now,
    chargeSampleLimited: charges.length === CHARGE_SAMPLE,
  });
}
