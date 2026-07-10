import { getOwnerStatement } from "@/lib/accounting/owner-statements";
import { prisma } from "@/lib/prisma";

export async function getOwnerStatementPageData(
  orgId: string,
  filters: {
    landlordId?: string;
    from?: string;
    to?: string;
  },
) {
  const now = new Date();
  const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const from = filters.from ? new Date(filters.from) : defaultFrom;
  const to = filters.to ? new Date(filters.to) : now;

  const [org, landlords] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { currencyCode: true, name: true },
    }),
    prisma.landlordProfile.findMany({
      where: { orgId, isActive: true, deletedAt: null },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
    }),
  ]);

  const selectedLandlordId = filters.landlordId ?? landlords[0]?.id ?? null;
  const statement = selectedLandlordId
    ? await getOwnerStatement(prisma, orgId, selectedLandlordId, from, to)
    : null;

  return {
    org,
    landlords,
    statement,
    filters: {
      landlordId: selectedLandlordId ?? undefined,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    },
  };
}