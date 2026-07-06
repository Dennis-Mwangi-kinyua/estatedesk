import { getFinancialSummary } from "@/lib/accounting/reports";
import { prisma } from "@/lib/prisma";

export async function getDistributionsPageData(orgId: string) {
  const now = new Date();
  const fiscalYearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const [org, landlords, properties, distributions, summary] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currencyCode: true, name: true },
    }),
    prisma.landlordProfile.findMany({
      where: { orgId, isActive: true, deletedAt: null },
      select: { id: true, displayName: true, phone: true, email: true },
      orderBy: { displayName: "asc" },
    }),
    prisma.property.findMany({
      where: { orgId, deletedAt: null, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.accountingJournalEntry.findMany({
      where: { orgId, sourceType: "OWNER_DISTRIBUTION" },
      include: {
        lines: {
          include: { account: true },
          orderBy: [{ debit: "desc" }, { credit: "desc" }],
        },
      },
      orderBy: { entryDate: "desc" },
      take: 20,
    }),
    getFinancialSummary(prisma, orgId, fiscalYearStart, now),
  ]);

  return {
    org,
    landlords,
    properties,
    distributions,
    ownerPayableBalance: summary.controlBalances.ownerPayable ?? 0,
    defaultDate: now.toISOString().slice(0, 10),
  };
}