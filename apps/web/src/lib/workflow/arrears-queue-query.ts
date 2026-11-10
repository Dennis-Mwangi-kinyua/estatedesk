import "server-only";
import type { Prisma, PrismaClient } from "@prisma/client";
import { nairobiMonthStart } from "@/lib/billing/period-dates";

/** Select each tenant's oldest unreminded charge in SQL; only transfer the queue preview. */
export async function loadUnremindedArrears(db: Pick<PrismaClient, "$queryRaw">, orgId: string, now: Date) {
  const rows = await db.$queryRaw<Array<{ id: string; period: string; balance: Prisma.Decimal; dueDate: Date; leaseId: string; tenantId: string; fullName: string; houseNo: string; total: bigint }>>`
    WITH candidates AS (
      SELECT DISTINCT ON (l."tenantId") c.id,c.period,c.balance,c."dueDate",c."leaseId",l."tenantId",t."fullName",u."houseNo"
      FROM "RentCharge" c JOIN "Lease" l ON l.id=c."leaseId" AND l."orgId"=c."orgId"
      JOIN "Tenant" t ON t.id=l."tenantId" JOIN "Unit" u ON u.id=l."unitId"
      WHERE c."orgId"=${orgId} AND c.balance>0 AND c."dueDate"<${now}
        AND c.status IN ('UNPAID','PARTIAL','OVERDUE') AND l."deletedAt" IS NULL AND l.status='ACTIVE'
        AND NOT EXISTS (SELECT 1 FROM "Notification" n WHERE n."orgId"=c."orgId" AND n."tenantId"=l."tenantId"
          AND n.type IN ('RENT_DUE_REMINDER','RENT_OVERDUE_REMINDER') AND n."createdAt">=${nairobiMonthStart(now)})
      ORDER BY l."tenantId",c."dueDate",c.id
    ) SELECT *,COUNT(*) OVER() AS total FROM candidates ORDER BY "dueDate",id LIMIT 25`;
  return { total: Number(rows[0]?.total ?? 0), items: rows.map(row => ({ ...row, lease: { tenantId: row.tenantId, tenant: { fullName: row.fullName }, unit: { houseNo: row.houseNo } } })) };
}
