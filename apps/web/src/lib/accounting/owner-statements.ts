import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";

type AccountingDb = PrismaClient | Prisma.TransactionClient;
import {
  aggregateOwnerStatementRows,
  ownerStatementTotals,
  type OwnerStatementLineInput,
} from "@/lib/accounting/owner-statement-policy";

export async function getOwnerStatement(
  db: AccountingDb,
  orgId: string,
  landlordId: string,
  from: Date,
  to: Date,
) {
  const landlord = await db.landlordProfile.findFirst({
    where: { id: landlordId, orgId, isActive: true, deletedAt: null },
    select: { id: true, displayName: true, email: true, phone: true },
  });

  if (!landlord) {
    throw new Error("Landlord was not found.");
  }

  const assignments = await db.landlordAssignment.findMany({
    where: { orgId, landlordProfileId: landlordId, active: true },
    select: {
      propertyId: true,
      property: { select: { id: true, name: true } },
    },
  });

  const propertyIds = [
    ...new Set(
      assignments
        .map((assignment) => assignment.propertyId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const propertyNameById = new Map(
    assignments
      .filter((assignment) => assignment.property)
      .map((assignment) => [assignment.property!.id, assignment.property!.name]),
  );

  const lines = await db.accountingJournalLine.findMany({
    where: {
      orgId,
      journal: {
        status: "POSTED",
        entryDate: { gte: from, lte: to },
      },
      OR: [{ landlordId }, ...(propertyIds.length ? [{ propertyId: { in: propertyIds } }] : [])],
      account: { type: { in: ["INCOME", "EXPENSE"] } },
    },
    select: {
      propertyId: true,
      debit: true,
      credit: true,
      account: { select: { type: true, systemKey: true } },
      journal: { select: { sourceType: true } },
    },
  });

  const distributionLines = await db.accountingJournalLine.findMany({
    where: {
      orgId,
      landlordId,
      credit: { gt: 0 },
      journal: {
        status: "POSTED",
        sourceType: "OWNER_DISTRIBUTION",
        entryDate: { gte: from, lte: to },
      },
    },
    select: {
      propertyId: true,
      debit: true,
      credit: true,
      account: { select: { type: true, systemKey: true } },
      journal: { select: { sourceType: true } },
    },
  });

  const mapped: OwnerStatementLineInput[] = [...lines, ...distributionLines].map((line) => ({
    propertyId: line.propertyId,
    propertyName: line.propertyId
      ? (propertyNameById.get(line.propertyId) ?? "Assigned property")
      : "Unassigned",
    accountType: line.account.type,
    systemKey: line.account.systemKey,
    sourceType: line.journal.sourceType,
    debit: Number(line.debit),
    credit: Number(line.credit),
  }));

  const properties = aggregateOwnerStatementRows(mapped);
  const totals = ownerStatementTotals(properties);

  return {
    landlord,
    from,
    to,
    properties,
    totals,
    assignedPropertyCount: propertyIds.length,
  };
}

export function ownerStatementToCsv(input: {
  landlordName: string;
  from: Date;
  to: Date;
  currencyCode: string;
  properties: Array<{
    propertyName: string;
    income: number;
    expenses: number;
    distributions: number;
    netToOwner: number;
  }>;
  totals: {
    income: number;
    expenses: number;
    distributions: number;
    netToOwner: number;
  };
}) {
  const rows: string[][] = [
    ["Owner statement", input.landlordName],
    ["Period", `${input.from.toISOString().slice(0, 10)} to ${input.to.toISOString().slice(0, 10)}`],
    [],
    ["Property", "Income", "Expenses", "Distributions", "Net to owner"],
  ];

  for (const row of input.properties) {
    rows.push([
      row.propertyName,
      row.income.toFixed(2),
      row.expenses.toFixed(2),
      row.distributions.toFixed(2),
      row.netToOwner.toFixed(2),
    ]);
  }

  rows.push([]);
  rows.push([
    "Total",
    input.totals.income.toFixed(2),
    input.totals.expenses.toFixed(2),
    input.totals.distributions.toFixed(2),
    input.totals.netToOwner.toFixed(2),
  ]);
  rows.push([]);
  rows.push(["Currency", input.currencyCode]);

  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}