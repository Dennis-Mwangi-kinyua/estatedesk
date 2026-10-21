import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { scopedPropertyWhere, type RecordScope } from "@/lib/permissions/record-scope";

type BnbClient = Pick<Prisma.TransactionClient, "property">;

export async function bnbListingScopeWhere(
  orgId: string,
  scope: RecordScope,
  client: BnbClient = prisma,
): Promise<Prisma.BnbListingWhereInput> {
  if (scope?.scopeType === "ORG") return { orgId, deletedAt: null };
  const properties = await client.property.findMany({
    where: scopedPropertyWhere(orgId, scope),
    select: { id: true },
  });
  return { orgId, deletedAt: null, propertyId: { in: properties.map(({ id }) => id) } };
}

export function canCreateUnlinkedBnb(scope: RecordScope) {
  return scope?.scopeType === "ORG";
}
