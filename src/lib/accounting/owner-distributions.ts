import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";
import { postJournalEntry } from "@/lib/accounting/engine";

type AccountingDb = PrismaClient | Prisma.TransactionClient;

function cashSystemKey(method: string) {
  if (method === "MPESA") return "MPESA";
  if (method === "CASH") return "CASH";
  return "BANK";
}

export async function postOwnerDistribution(input: {
  db: AccountingDb;
  orgId: string;
  landlordId: string;
  amount: number;
  paymentMethod: string;
  entryDate: Date;
  description: string;
  propertyId?: string | null;
  userId?: string | null;
}) {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("Distribution amount must be greater than zero.");
  }

  const landlord = await input.db.landlordProfile.findFirst({
    where: { id: input.landlordId, orgId: input.orgId, isActive: true, deletedAt: null },
    select: { id: true, displayName: true },
  });

  if (!landlord) {
    throw new Error("Landlord was not found.");
  }

  const sourceId = `owner-distribution:${landlord.id}:${Date.now()}`;

  return postJournalEntry({
    db: input.db,
    orgId: input.orgId,
    entryDate: input.entryDate,
    description: input.description || `Owner distribution to ${landlord.displayName}`,
    memo: landlord.displayName,
    sourceType: "OWNER_DISTRIBUTION",
    sourceId,
    userId: input.userId,
    lines: [
      {
        systemKey: "OWNER_PAYABLE",
        debit: input.amount,
        landlordId: landlord.id,
        propertyId: input.propertyId,
      },
      {
        systemKey: cashSystemKey(input.paymentMethod),
        credit: input.amount,
        landlordId: landlord.id,
        propertyId: input.propertyId,
      },
    ],
  });
}