import "server-only";
import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import { encodePublicId } from "@/lib/public-id";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/auth/session";
import { assertManagementSession, promiseProgress } from "@/features/org-management/policy";
import { staffOptions } from "@/features/org-management/queries";
import { nairobiDayStart, nairobiMonthStart } from "@/lib/billing/period-dates";
import { COLLECTION_TASK, collectionViews, reminderText } from "./policy";
export type CollectionQuery = { q?: string; view?: string; page?: string; tenantId?: string };
type QueueRow = { id: string; fullName: string; balance: Prisma.Decimal; oldestDue: Date; taskId: string | null; assigneeId: string | null; dueAt: Date | null; broken: bigint; reviews: bigint };
export function reminderVersion(value: { id: string; fullName: string; email: string | null; userId: string | null; balance: string; currency: string; date: string }) { return createHash("sha256").update(JSON.stringify({id:value.id,name:value.fullName,email:value.email,userId:value.userId,balance:value.balance,currency:value.currency,date:value.date})).digest("hex"); }
export function arrearsCte(orgId: string, now: Date) {
  return Prisma.sql`WITH arrears AS (
    SELECT t.id,t."fullName",SUM(c.balance) balance,MIN(c."dueDate") AS "oldestDue"
    FROM "RentCharge" c JOIN "Lease" l ON l.id=c."leaseId" AND l."orgId"=c."orgId"
    JOIN "Tenant" t ON t.id=l."tenantId" AND t."orgId"=l."orgId"
    JOIN "Unit" u ON u.id=l."unitId" JOIN "Property" p ON p.id=u."propertyId" AND p."orgId"=l."orgId"
    WHERE c."orgId"=${orgId} AND c."chargeType"='RENT' AND c.balance>0 AND c."dueDate"<${nairobiDayStart(now)}
    AND c.status IN ('UNPAID','PARTIAL','OVERDUE') AND l."deletedAt" IS NULL AND l.status IN ('ACTIVE','TERMINATED')
    AND t."deletedAt" IS NULL AND t."archivedAt" IS NULL AND u."deletedAt" IS NULL AND p."deletedAt" IS NULL GROUP BY t.id,t."fullName"
  ), tasks AS (
    SELECT DISTINCT ON ("tenantId") id,"tenantId","assigneeId","dueAt" FROM "CrmActivity"
    WHERE "scopeOrgId"=${orgId} AND subject=${COLLECTION_TASK} AND kind='TASK' AND "completedAt" IS NULL
    ORDER BY "tenantId","dueAt",id
  ), promise_tasks AS (
    SELECT DISTINCT ON (l."tenantId") l."tenantId",cp."assigneeId",cp."followUpAt" AS "dueAt"
    FROM "CollectionPromise" cp JOIN "Lease" l ON l.id=cp."leaseId" AND l."orgId"=cp."orgId"
    WHERE cp."orgId"=${orgId} AND cp.status='OPEN' AND l."deletedAt" IS NULL
    ORDER BY l."tenantId",cp."followUpAt",cp.id
  ), paid AS (SELECT "leaseId",SUM("amountPaid") amount FROM "RentCharge" WHERE "orgId"=${orgId} GROUP BY "leaseId"),
  broken AS (
    SELECT l."tenantId",COUNT(*) count FROM "CollectionPromise" cp JOIN "Lease" l ON l.id=cp."leaseId" AND l."orgId"=cp."orgId"
    LEFT JOIN paid ON paid."leaseId"=l.id WHERE cp."orgId"=${orgId} AND cp.status='OPEN' AND cp."dueAt"<${now}
    AND COALESCE(paid.amount,0)-cp."baselinePaid"<cp.amount GROUP BY l."tenantId"
  ), reviews AS (
    SELECT COALESCE(p."payerTenantId",pl."tenantId") AS "payerTenantId",COUNT(*) count FROM "Payment" p
    LEFT JOIN "RentCharge" rc ON rc.id=p."rentChargeId" AND rc."orgId"=p."orgId"
    LEFT JOIN "Lease" pl ON pl.id=rc."leaseId" AND pl."orgId"=p."orgId"
    WHERE p."orgId"=${orgId} AND p."reversedAt" IS NULL AND p."targetType"='RENT'
    AND ((p."verificationStatus"='PENDING' AND p."gatewayStatus"<>'FAILED' AND (p.method<>'MPESA_STK' OR p."gatewayStatus"='SUCCESS')) OR p."reconciliationStatus"='DISPUTED' OR (p."gatewayStatus"='SUCCESS' AND (p."unappliedAmount">0 OR p."reconciliationStatus"='UNRECONCILED')))
    GROUP BY COALESCE(p."payerTenantId",pl."tenantId")
  ), queue AS (
    SELECT a.*,t.id AS "taskId",COALESCE(t."assigneeId",pt."assigneeId") AS "assigneeId",COALESCE(t."dueAt",pt."dueAt") AS "dueAt",COALESCE(b.count,0) broken,COALESCE(r.count,0) reviews
    FROM arrears a LEFT JOIN tasks t ON t."tenantId"=a.id LEFT JOIN promise_tasks pt ON pt."tenantId"=a.id LEFT JOIN broken b ON b."tenantId"=a.id LEFT JOIN reviews r ON r."payerTenantId"=a.id
  )`;
}
export async function collectionsData(session: AppSession, query: CollectionQuery, now = new Date(), native = false) {
  const orgId = assertManagementSession(session, "collections");
  const view = collectionViews.find(v => v === query.view) ?? "all";
  const page = Math.max(1, Math.min(10000, Math.trunc(Number(query.page) || 1)));
  const q = query.q?.trim().slice(0,100) ?? "";
  const dayEnd = new Date(nairobiDayStart(now).getTime()+86400000);
  const condition = Prisma.sql`${query.tenantId ? Prisma.sql`id=${query.tenantId}` : Prisma.sql`TRUE`} AND ${q ? Prisma.sql`"fullName" ILIKE ${`%${q}%`}` : Prisma.sql`TRUE`} AND ${
    view === "mine" ? Prisma.sql`"assigneeId"=${session.userId}` : view === "unassigned" ? Prisma.sql`"assigneeId" IS NULL` : view === "today" ? Prisma.sql`"dueAt"<${dayEnd}` : view === "broken" ? Prisma.sql`broken>0` : view === "payment-review" ? Prisma.sql`reviews>0` : Prisma.sql`TRUE`}`;
  const cte = arrearsCte(orgId, now);
  const [rows, totals, org, staff, receipts, unknownPayments, keptPromises] = await Promise.all([
    prisma.$queryRaw<QueueRow[]>(Prisma.sql`${cte} SELECT * FROM queue WHERE ${condition} ORDER BY (reviews>0) DESC,(broken>0) DESC,"oldestDue",id LIMIT ${native ? 26 : 25} OFFSET ${(page-1)*25}`),
    prisma.$queryRaw<Array<{ accounts: bigint; balance: Prisma.Decimal; broken: bigint; today: bigint; filtered: bigint }>>(Prisma.sql`${cte} SELECT COUNT(*) accounts,COALESCE(SUM(balance),0) balance,COUNT(*) FILTER (WHERE broken>0) broken,COUNT(*) FILTER (WHERE "dueAt"<${dayEnd}) today,COUNT(*) FILTER (WHERE ${condition}) filtered FROM queue`),
    prisma.organization.findUniqueOrThrow({ where: { id: orgId }, select: { currencyCode:true } }), staffOptions(orgId),
    prisma.$queryRaw<Array<{ today: Prisma.Decimal; month: Prisma.Decimal }>>`SELECT COALESCE(SUM(a.amount) FILTER (WHERE p."paidAt">=${nairobiDayStart(now)}),0) AS "today",COALESCE(SUM(a.amount),0) AS "month" FROM "PaymentAllocation" a JOIN "Payment" p ON p.id=a."paymentId" AND p."orgId"=a."orgId" JOIN "RentCharge" c ON c.id=a."rentChargeId" AND c."orgId"=a."orgId" WHERE a."orgId"=${orgId} AND c."chargeType"='RENT' AND p."gatewayStatus"='SUCCESS' AND p."verificationStatus" IN ('VERIFIED','NOT_REQUIRED') AND p."reversedAt" IS NULL AND p."paidAt">=${nairobiMonthStart(now)} AND p."paidAt"<${now}`,
    prisma.payment.count({ where: { orgId, payerTenantId:null, rentChargeId:null, targetType:"RENT", reversedAt:null, OR:[{verificationStatus:"PENDING",gatewayStatus:{not:"FAILED"},OR:[{method:{not:"MPESA_STK"}},{gatewayStatus:"SUCCESS"}]},{reconciliationStatus:"DISPUTED"},{gatewayStatus:"SUCCESS",unappliedAmount:{gt:0}}] } }),
    prisma.collectionPromise.count({where:{orgId,status:"FULFILLED",resolvedAt:{gte:nairobiMonthStart(now),lte:now}}}),
  ]);
  const ids=rows.map(r=>r.id);
  const [tenants, leases, tasks, notifications, promises] = await Promise.all([
    prisma.tenant.findMany({where:{orgId,id:{in:ids}},select:{id:true,email:true,phone:true,userId:true}}),
    prisma.lease.findMany({where:{orgId,tenantId:{in:ids},deletedAt:null,status:{in:["ACTIVE","TERMINATED"]}},select:{id:true,tenantId:true,unit:{select:{houseNo:true,property:{select:{name:true}}}}}}),
    prisma.crmActivity.findMany({where:{scopeOrgId:orgId,tenantId:{in:ids},subject:COLLECTION_TASK,completedAt:null},include:{assignee:{select:{fullName:true}}},orderBy:[{dueAt:"asc"},{id:"asc"}]}),
    prisma.notification.findMany({where:{orgId,tenantId:{in:ids},type:"RENT_OVERDUE_REMINDER"},orderBy:{createdAt:"desc"},take:100,select:{id:true,tenantId:true,channel:true,status:true,createdAt:true,readAt:true}}),
    prisma.collectionPromise.findMany({where:{orgId,status:"OPEN",lease:{tenantId:{in:ids}}},include:{lease:{select:{tenantId:true,rentCharges:{select:{amountPaid:true}}}}}}),
  ]);
  const date=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Nairobi",dateStyle:"medium"}).format(now);
  return { page,view,q,date,currency:org.currencyCode,staff:staff.map(s=>({id:s.userId,name:s.user.fullName})),
    total:Number(totals[0]?.filtered??0), accounts:Number(totals[0]?.accounts??0),overdue:Number(totals[0]?.balance??0),broken:Number(totals[0]?.broken??0),dueToday:Number(totals[0]?.today??0),collectedToday:Number(receipts[0]?.today??0),collectedMonth:Number(receipts[0]?.month??0),unknownPayments,keptPromises,
    rows:rows.map(r=>{const t=tenants.find(t=>t.id===r.id)!;const balance=r.balance.toFixed(2);return {id:r.id,tenantHref:`/dashboard/org/tenants/${encodePublicId(r.id,"tenant")}`,name:r.fullName,balance:Number(balance),oldestDue:r.oldestDue.toISOString(),phone:t.phone,email:t.email,userId:t.userId,owner:staff.find(s=>s.userId===r.assigneeId)?.user.fullName??(r.assigneeId?"Assigned staff":null),nextContactAt:r.dueAt?.toISOString()??null,reviews:Number(r.reviews),broken:Number(r.broken),
      leases:leases.filter(l=>l.tenantId===r.id).map(l=>({id:l.id,label:`${l.unit.property.name} · ${l.unit.houseNo}`})),
      tasks:tasks.filter(a=>a.tenantId===r.id).map(a=>({id:a.id,owner:a.assignee?.fullName??"Unassigned",dueAt:a.dueAt?.toISOString()??null,body:a.body})),
      promises:promises.filter(p=>p.lease.tenantId===r.id).map(p=>({id:p.id,amount:Number(p.amount),dueAt:p.dueAt.toISOString(),...promiseProgress(Number(p.amount),Number(p.baselinePaid),p.lease.rentCharges.reduce((n,c)=>n+Number(c.amountPaid),0),p.dueAt,now)})),
      notifications:notifications.filter(n=>n.tenantId===r.id).slice(0,3).map(n=>({...n,createdAt:n.createdAt.toISOString(),readAt:n.readAt?.toISOString()??null})),
      reminder:reminderText(r.fullName,balance,org.currencyCode,date),version:reminderVersion({id:r.id,fullName:r.fullName,email:t.email,userId:t.userId,balance,currency:org.currencyCode,date})};}),
  };
}
export type CollectionsData = Awaited<ReturnType<typeof collectionsData>>;
