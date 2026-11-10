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
  const reports: RetentionOrgReport[] = [];
  const now = Date.now();
  let after: string | undefined;
  for (;;) {
    const organizations = await prisma.organization.findMany({
      where: { deletedAt: null, ...(after ? { id: { gt: after } } : {}) },
      select: { id: true, name: true, dataRetentionDays: true },
      orderBy: { id: "asc" }, take: 100,
    });
    for (let start = 0; start < organizations.length; start += 4) {
      const batch = await Promise.all(organizations.slice(start, start + 4).map(async org => {
        const cutoff = new Date(now - org.dataRetentionDays * 86400000);
        const counts = await countDeletedBefore(org.id, cutoff);
        return { orgId: org.id, orgName: org.name, retentionDays: org.dataRetentionDays,
          cutoff: cutoff.toISOString(), counts, total: counts.reduce((sum, item) => sum + item.count, 0) };
      }));
      reports.push(...batch.filter(report => report.total > 0));
    }
    if (organizations.length < 100) break;
    after = organizations[organizations.length - 1].id;
  }
  return reports.sort((a, b) => a.orgName.localeCompare(b.orgName));
}
