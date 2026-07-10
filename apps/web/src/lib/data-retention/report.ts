import "server-only";

import { prisma } from "@/lib/prisma";

type RetentionModelCount = {
  model: string;
  count: number;
};

export type RetentionOrgReport = {
  orgId: string;
  orgName: string;
  retentionDays: number;
  cutoff: string;
  counts: RetentionModelCount[];
  total: number;
};

async function countDeletedBefore(orgId: string, cutoff: Date) {
  const [
    assets,
    taxpayerProfiles,
    properties,
    buildings,
    units,
    tenants,
    leases,
    landlordProfiles,
  ] = await Promise.all([
    prisma.asset.count({ where: { orgId, deletedAt: { lt: cutoff } } }),
    prisma.taxpayerProfile.count({ where: { orgId, deletedAt: { lt: cutoff } } }),
    prisma.property.count({ where: { orgId, deletedAt: { lt: cutoff } } }),
    prisma.building.count({
      where: { deletedAt: { lt: cutoff }, property: { orgId } },
    }),
    prisma.unit.count({
      where: { deletedAt: { lt: cutoff }, property: { orgId } },
    }),
    prisma.tenant.count({ where: { orgId, deletedAt: { lt: cutoff } } }),
    prisma.lease.count({ where: { orgId, deletedAt: { lt: cutoff } } }),
    prisma.landlordProfile.count({ where: { orgId, deletedAt: { lt: cutoff } } }),
  ]);

  return [
    { model: "Asset", count: assets },
    { model: "TaxpayerProfile", count: taxpayerProfiles },
    { model: "Property", count: properties },
    { model: "Building", count: buildings },
    { model: "Unit", count: units },
    { model: "Tenant", count: tenants },
    { model: "Lease", count: leases },
    { model: "LandlordProfile", count: landlordProfiles },
  ];
}

export async function buildRetentionReport(): Promise<RetentionOrgReport[]> {
  const organizations = await prisma.organization.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      dataRetentionDays: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const reports = await Promise.all(
    organizations.map(async (org) => {
      const cutoff = new Date(Date.now() - org.dataRetentionDays * 24 * 60 * 60 * 1000);
      const counts = await countDeletedBefore(org.id, cutoff);
      const total = counts.reduce((sum, item) => sum + item.count, 0);

      return {
        orgId: org.id,
        orgName: org.name,
        retentionDays: org.dataRetentionDays,
        cutoff: cutoff.toISOString(),
        counts,
        total,
      };
    }),
  );

  return reports.filter((report) => report.total > 0);
}
