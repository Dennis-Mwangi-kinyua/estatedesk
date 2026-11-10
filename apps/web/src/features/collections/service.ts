import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AppSession } from "@/lib/auth/session";
import { assertManagementSession, ensure, endOfDay } from "@/features/org-management/policy";
import { assertAssigneeAccess } from "@/features/org-management/service";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { COLLECTION_TASK, followUpSchema, reminderSchema, reminderText } from "./policy";
import { arrearsCte, reminderVersion } from "./queries";
async function audit(tx: Prisma.TransactionClient, session: AppSession, action: string, id: string) { await tx.auditLog.create({data:{orgId:session.activeOrgId!,actorUserId:session.userId,action,entityType:"Collections",entityId:id}}); }
async function lockTenant(tx: Prisma.TransactionClient, orgId: string, tenantId: string) {
  await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(hashtext(${`collection:${orgId}:${tenantId}`}))`;
  const tenant=await tx.tenant.findFirst({where:{orgId,id:tenantId,deletedAt:null,archivedAt:null},select:{id:true,fullName:true,email:true,userId:true}});
  ensure(tenant,"Tenant unavailable in this organization.");return tenant;
}
export async function assignCollectionFollowUp(session: AppSession, input: unknown) {
  const orgId=assertManagementSession(session,"collections");const data=followUpSchema.parse(input);
  const dueAt=endOfDay(data.date);ensure(dueAt>new Date(),"Choose today or a future follow-up date.");
  return prisma.$transaction(async tx=>{
    await lockTenant(tx,orgId,data.tenantId);
    await assertAssigneeAccess(tx,session,data.assigneeId,["/dashboard/org/collections"]);
    const key=`collection-task:${orgId}:${session.userId}:${data.requestKey}`;
    const replay=await tx.crmActivity.findUnique({where:{requestKey:key}});
    if(replay){ensure(replay.tenantId===data.tenantId,"Submission belongs to another tenant.");return;}
    const [account]=await tx.$queryRaw<Array<{balance:Prisma.Decimal}>>(Prisma.sql`${arrearsCte(orgId,new Date())} SELECT balance FROM queue WHERE id=${data.tenantId}`);
    ensure(account,"This tenant no longer has overdue rent. Refresh the queue.");
    const previous=await tx.crmActivity.findFirst({where:{scopeOrgId:orgId,tenantId:data.tenantId,subject:COLLECTION_TASK,kind:"TASK",completedAt:null},orderBy:[{dueAt:"asc"},{id:"asc"}]});
    const task=previous?await tx.crmActivity.update({where:{id:previous.id},data:{assigneeId:data.assigneeId,dueAt,body:data.note}}):await tx.crmActivity.create({data:{scopeOrgId:orgId,tenantId:data.tenantId,authorId:session.userId,assigneeId:data.assigneeId,subject:COLLECTION_TASK,kind:"TASK",dueAt,body:data.note}});
    await tx.crmActivity.create({data:{scopeOrgId:orgId,tenantId:data.tenantId,authorId:session.userId,subject:"Collection follow-up assignment",kind:"CHANGE",body:data.note,requestKey:key}});
    await audit(tx,session,"COLLECTION_FOLLOW_UP_ASSIGNED",task.id);
  },{isolationLevel:"Serializable"});
}
export async function completeCollectionFollowUp(session: AppSession, id: string) {
  const orgId=assertManagementSession(session,"collections");
  await prisma.$transaction(async tx=>{
    const changed=await tx.crmActivity.updateMany({where:{id,scopeOrgId:orgId,subject:COLLECTION_TASK,kind:"TASK",completedAt:null},data:{completedAt:new Date()}});
    ensure(changed.count===1,"Follow-up unavailable or already completed.");await audit(tx,session,"COLLECTION_FOLLOW_UP_COMPLETED",id);
  });
}
export async function approveCollectionReminder(session: AppSession, input: unknown) {
  const orgId=assertManagementSession(session,"collections");const data=reminderSchema.parse(input);
  ensure(canAccessWorkspacePath(session,"/dashboard/org/notifications"),"Notification access is required to approve reminders.");
  return prisma.$transaction(async tx=>{
    const tenant=await lockTenant(tx,orgId,data.tenantId);
    const key=`collection-reminder:${orgId}:${session.userId}:${data.requestKey}`;
    const replay=await tx.crmActivity.findUnique({where:{requestKey:key}});
    if(replay){ensure(replay.tenantId===data.tenantId,"Submission belongs to another tenant.");return;}
    const now=new Date();const org=await tx.organization.findUniqueOrThrow({where:{id:orgId},select:{currencyCode:true}});
    const [account]=await tx.$queryRaw<Array<{balance:Prisma.Decimal;reviews:bigint}>>(Prisma.sql`${arrearsCte(orgId,now)} SELECT balance,reviews FROM queue WHERE id=${data.tenantId}`);
    ensure(account,"This tenant no longer has overdue rent. Refresh the queue.");
    ensure(Number(account.reviews)===0,"Review this tenant's pending, unmatched or disputed payments before sending a reminder.");
    const date=new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Nairobi",dateStyle:"medium"}).format(now);
    const balance=account.balance.toFixed(2);
    ensure(data.version===reminderVersion({...tenant,balance,currency:org.currencyCode,date}),"The balance, contact or date changed. Refresh and approve the updated preview.");
    ensure(data.channel==="EMAIL"?!!tenant.email:!!tenant.userId,"This tenant has no contact for the selected channel.");
    const {nairobiDayStart}=await import("@/lib/billing/period-dates");
    ensure(!await tx.notification.findFirst({where:{orgId,tenantId:tenant.id,type:"RENT_OVERDUE_REMINDER",channel:data.channel,createdAt:{gte:nairobiDayStart(now)},status:{in:["QUEUED","SENT"]}}}),"A reminder is already queued or sent on this channel today.");
    const message=reminderText(tenant.fullName,balance,org.currencyCode,date);
    const notice=await tx.notification.create({data:{orgId,tenantId:tenant.id,userId:tenant.userId,channel:data.channel,type:"RENT_OVERDUE_REMINDER",title:"Rent statement follow-up",message,status:data.channel==="IN_APP"?"SENT":"QUEUED",sentAt:data.channel==="IN_APP"?now:null}});
    await tx.crmActivity.create({data:{scopeOrgId:orgId,tenantId:tenant.id,authorId:session.userId,kind:"NOTE",subject:"Approved rent reminder",body:`${data.channel} reminder approved. Notification: ${notice.id}\n${message}`,requestKey:key}});
    await audit(tx,session,"COLLECTION_REMINDER_APPROVED",notice.id);
  },{isolationLevel:"Serializable"});
}
