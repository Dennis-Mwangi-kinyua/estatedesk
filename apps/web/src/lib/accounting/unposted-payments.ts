import type { PrismaClient } from "@prisma/client";

type AccountingDatabase = Pick<PrismaClient, "$queryRaw" | "payment">;

/** Count the complete backlog in SQL; transfer only the eight preview records. */
export async function getUnpostedPaymentSummary(db: AccountingDatabase, orgId: string) {
  const rows = await db.$queryRaw<Array<{ id: string; totalCount: bigint }>>`
    SELECT p."id", COUNT(*) OVER() AS "totalCount"
    FROM "Payment" p
    WHERE p."orgId" = ${orgId}
      AND p."verificationStatus" IN ('VERIFIED', 'NOT_REQUIRED')
      AND NOT EXISTS (
        SELECT 1 FROM "AccountingJournalEntry" j
        WHERE j."orgId" = p."orgId" AND j."sourceType" = 'PAYMENT' AND j."sourceId" = p."id"
      )
    ORDER BY p."createdAt" DESC, p."id" DESC
    LIMIT 8
  `;
  const payments = rows.length ? await db.payment.findMany({
    where: { orgId, id: { in: rows.map(row => row.id) } },
    select: { id: true, amount: true, method: true, targetType: true, paidAt: true, createdAt: true, payerTenant: { select: { fullName: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 8,
  }) : [];
  return { payments, count: Number(rows[0]?.totalCount ?? 0) };
}
