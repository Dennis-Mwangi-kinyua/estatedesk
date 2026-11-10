import "server-only";
import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import type { AppSession } from "@/lib/auth/session";
import type { MobileWorkspaceKind, NativeActionDefinition, NativeActionField, NativeActionLink, NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { tenantCrmWhere, stages, label } from "@/features/crm/policy";
import { activityInclude, orgOwners, platformOwners } from "@/features/crm/queries";
import { loadCrmReport } from "@/features/crm/report-service";
import { createSalesLead, updateSalesLead, updateLeadContact, addCrmActivity, completeCrmActivity, updateCrmTask, sendCrmMessage } from "@/features/crm/actions";

export const crmPaths = (kind: MobileWorkspaceKind) => kind === "platform"
  ? ["/platform/demos", "/platform/crm", "/platform/crm/customers", "/platform/crm/tasks", "/platform/crm/reports", "/platform/crm/history"]
  : kind === "organization" ? ["/dashboard/org/crm", "/dashboard/org/crm/tasks", "/dashboard/org/crm/reports", "/dashboard/org/crm/history"] : [];
export function nativeCrmAllowed(session: AppSession, kind: MobileWorkspaceKind, path: string) {
  return crmPaths(kind).includes(path) && (kind === "platform" ? ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole) : !!session.activeOrgId && canAccessWorkspacePath(session, "/dashboard/org/crm"));
}
export function crmActivityScope(session: AppSession, kind: MobileWorkspaceKind): Prisma.CrmActivityWhereInput {
  return kind === "platform" ? { scopeOrgId: null, OR: [{ leadId: { not: null } }, { customerOrg: { deletedAt: null } }] }
    : { scopeOrgId: session.activeOrgId!, tenant: tenantCrmWhere(session.activeOrgId!, session.membershipScope) };
}
const activityActions: NativeActionLink[] = [{ id: "crm.activity", title: "Add interaction or follow-up" }, { id: "crm.send", title: "Send customer message" }];
const date = (value: Date | null | undefined) => value ? new Intl.DateTimeFormat("en-KE", { timeZone: "Africa/Nairobi", dateStyle: "medium", timeStyle: "short" }).format(value) + " EAT" : "—";
function record(id: string, title: string, fields: Record<string, unknown>, status?: string, actions?: NativeActionLink[]): NativeWorkspaceRecord {
  return { id, title, subtitle: "", status, actions, fields: Object.entries(fields).map(([key,value]) => ({ label: key, value: value === null || value === undefined || value === "" ? "—" : String(value) })) };
}
function historyLink(kind: MobileWorkspaceKind, id: string) { return [{ title: "Activity history", path: `${kind === "platform" ? "/platform" : "/dashboard/org"}/crm/history`, recordId: id, emoji: "🕘", description: "Conversations, messages, tasks and recorded changes." }]; }
export async function nativeCrmTarget(session: AppSession, kind: MobileWorkspaceKind, token?: string) {
  const match = /^(lead|organization|tenant):([^:]{1,200})$/.exec(token ?? "");
  if (!match) return null;
  const [,target,id] = match;
  if (kind === "platform" && ["SUPER_ADMIN", "PLATFORM_ADMIN"].includes(session.platformRole)) {
    if (target === "lead") {
      const row = await prisma.onboardingRequest.findUnique({ where: { id }, select: { id:true,companyName:true } });
      if (row) return { target, id, title: row.companyName, where: { leadId:id, scopeOrgId:null } };
    }
    if (target === "organization") {
      const row = await prisma.organization.findFirst({ where: { id,deletedAt:null }, select: { id:true,name:true } });
      if (row) return { target, id, title: row.name, where: { customerOrgId:id, scopeOrgId:null } };
    }
  }
  if (kind === "organization" && target === "tenant" && session.activeOrgId && canAccessWorkspacePath(session,"/dashboard/org/crm")) {
    const row=await prisma.tenant.findFirst({ where:{...tenantCrmWhere(session.activeOrgId,session.membershipScope),id},select:{id:true,fullName:true} });
    if(row)return { target,id,title:row.fullName,where:{tenantId:id,scopeOrgId:session.activeOrgId} };
  }
  return null;
}
export async function nativeCrmRecords(session: AppSession, kind: MobileWorkspaceKind, path: string, q: string, page: number, token?: string) {
  if (!nativeCrmAllowed(session,kind,path)) return { records: [] as NativeWorkspaceRecord[], notice:"CRM access is unavailable.",searchable:false };
  const take=26,skip=(page-1)*25;
  const contains={contains:q,mode:"insensitive" as const};
  if(path.endsWith("/reports")) {
    const report=await loadCrmReport(session,kind==="platform",q.startsWith("days:")?q.slice(5):undefined);
    const cards=[record("crm-overview","Customer relationships",{Customers:report.customers,"Open follow-ups":report.open,"Overdue follow-ups":report.overdue,"Completed in period":report.completed}),record("crm-activity","Activity by type",Object.fromEntries(report.activities.map(a=>[label(a.kind),a._count])))];
    if(kind==="platform")cards.push(record("crm-stages","Lead stages",Object.fromEntries(stages.map(s=>[label(s),report.sales.find(a=>a.salesStage===s)?._count??0]))),record("crm-sources","Lead sources",Object.fromEntries(report.sources.map(s=>[label(s.source),s._count]))),record("crm-pipeline","Expected monthly pipeline",Object.fromEntries(report.pipeline.map(p=>[p.currencyCode,Number(p._sum.expectedMonthlyValue??0).toLocaleString()]))),record("crm-plans","Customer subscriptions",Object.fromEntries(report.plans.map(p=>[`${p.plan} · ${p.status}`,p._count]))),record("crm-outcomes","Sales outcomes",{Won:report.won,Lost:report.lost,"Win rate":report.won+report.lost?`${Math.round(report.won/(report.won+report.lost)*100)}%`:"—"}));
    else cards.push(record("crm-tenants","Customer status",Object.fromEntries(report.tenants.map(t=>[label(t.status),t._count]))),record("crm-rentals","Rental lead stages",Object.fromEntries(report.rentals.map(r=>[label(r.status),r._count]))));
    return {records:page===1?cards:[],searchable:false,notice:`Last ${report.days} days for activities, completions and lead cohorts. Customer totals, subscriptions, open tasks and unweighted monthly pipeline estimates show the current position.`};
  }
  if(path.endsWith("/history")||path.endsWith("/tasks")) {
    const target=token?await nativeCrmTarget(session,kind,token):null;
    if(token&&!target)return {records:[],notice:"Customer unavailable."};
    const task=path.endsWith("/tasks");
    const view=q.startsWith("view:")?q.slice(5):"open";
    const text=q.startsWith("view:")?"":q;
    const where:Prisma.CrmActivityWhereInput={...crmActivityScope(session,kind),...(target?target.where:{}),...(task?{dueAt:view==="overdue"?{lt:new Date()}:{not:null},completedAt:view==="completed"?{not:null}:null,...(view==="mine"?{assigneeId:session.userId}:{})}:{}),...(text?{body:{contains:text,mode:"insensitive"}}:{})};
    const rows=await prisma.crmActivity.findMany({where,skip,take,orderBy:task?[{dueAt:"asc"},{id:"asc"}]:[{createdAt:"desc"},{id:"desc"}],include:{...activityInclude,lead:{select:{companyName:true}},tenant:{select:{fullName:true}},customerOrg:{select:{name:true}}}});
    return {records:rows.map(a=>({...record(`activity:${a.id}`,a.subject??a.body.slice(0,100),{Customer:a.lead?.companyName??a.tenant?.fullName??a.customerOrg?.name,Type:label(a.kind),Notes:a.body,Author:a.author.fullName,"Assigned to":a.assignee?.fullName,Priority:label(a.priority),Created:date(a.createdAt),Due:date(a.dueAt),Completed:date(a.completedAt),Delivery:a.deliveryStatus?label(a.deliveryStatus):null},a.completedAt?"COMPLETED":a.dueAt&&a.dueAt<new Date()?"OVERDUE":a.kind,!a.completedAt&&a.dueAt?[{id:"crm.complete",title:"Complete follow-up"},...(a.subject!=="Sales demo"?[{id:"crm.task",title:"Edit follow-up"}]:[])]:[]),links:historyLink(kind,a.leadId?`lead:${a.leadId}`:a.tenantId?`tenant:${a.tenantId}`:`organization:${a.customerOrgId}`)})),notice:task?"Follow-ups are ordered by due date. Reschedule sales demos from the prospect record.":"Customer communication and relationship history. Dates are shown in East Africa Time."};
  }
  const target=token?await nativeCrmTarget(session,kind,token):null;
  if(token&&!target)return {records:[],notice:"Customer unavailable."};
  if(kind==="platform"&&!path.endsWith("/customers")) {
    if(target&&target.target!=="lead")return {records:[],notice:"Prospect unavailable."};
    const stage=q.startsWith("stage:")&&stages.includes(q.slice(6) as typeof stages[number])?q.slice(6) as typeof stages[number]:undefined;
    const search=stage||q==="owner:me"?"":q;
    const where:Prisma.OnboardingRequestWhereInput={...(path === "/platform/demos" ? {source:"DEMO_REQUEST"} : {}),...(target?{id:target.id}:{}),...(stage?{salesStage:stage}:{}),...(q==="owner:me"?{salesOwnerId:session.userId}:{}),...(search?{OR:[{companyName:{contains:search,mode:"insensitive"}},{fullName:{contains:search,mode:"insensitive"}},{workEmail:{contains:search,mode:"insensitive"}}]}:{})};
    const rows=await prisma.onboardingRequest.findMany({where,skip,take,orderBy:[{updatedAt:"desc"},{id:"desc"}],include:{salesOwner:{select:{fullName:true}},customerOrg:{select:{name:true,subscription:{select:{plan:true,status:true,trialEndsAt:true}}}}}});
    return {records:rows.map(l=>({...record(`lead:${l.id}`,l.companyName,{Contact:l.fullName,Email:l.workEmail,Phone:l.phone,Portfolio:l.managedPropertyType,Enquiry:l.message,"Sales owner":l.salesOwner?.fullName,"Target plan":l.targetPlan,"Monthly value":l.expectedMonthlyValue===null?null:`${l.currencyCode} ${l.expectedMonthlyValue}`,Demo:date(l.demoAt),"Trial ends":date(l.customerOrg?.subscription?.trialEndsAt),Customer:l.customerOrg?.name,Subscription:l.customerOrg?.subscription?`${l.customerOrg.subscription.plan} · ${l.customerOrg.subscription.status}`:null,Source:l.source,"Lost reason":l.lostReason},l.salesStage,[{id:"crm.deal",title:"Update deal and demo"},{id:"crm.contact",title:"Edit contact information"},...activityActions]),links:historyLink(kind,`lead:${l.id}`)}))};
  }
  if(kind==="platform") {
    if(target&&target.target!=="organization")return {records:[],notice:"Customer unavailable."};
    const rows=await prisma.organization.findMany({where:{deletedAt:null,...(target?{id:target.id}:{}),...(q?{OR:[{name:contains},{email:contains},{phone:{contains:q}}]}:{})},skip,take,orderBy:[{name:"asc"},{id:"asc"}],select:{id:true,name:true,email:true,phone:true,address:true,status:true,subscription:{select:{plan:true,status:true}}}});
    return {records:rows.map(c=>({...record(`organization:${c.id}`,c.name,{Email:c.email,Phone:c.phone,Address:c.address,Plan:c.subscription?.plan,"Subscription status":c.subscription?.status},c.status,activityActions),links:historyLink(kind,`organization:${c.id}`)}))};
  }
  if(target&&target.target!=="tenant")return {records:[],notice:"Customer unavailable."};
  const rows=await prisma.tenant.findMany({where:{...tenantCrmWhere(session.activeOrgId!,session.membershipScope),...(target?{id:target.id}:{}),...(q?{OR:[{fullName:contains},{email:contains},{phone:{contains:q}}]}:{})},skip,take,orderBy:[{fullName:"asc"},{id:"asc"}],select:{id:true,fullName:true,email:true,phone:true,status:true,companyName:true,notes:true}});
  return {records:rows.map(t=>({...record(`tenant:${t.id}`,t.fullName,{Email:t.email,Phone:t.phone,Company:t.companyName,Notes:t.notes},t.status,activityActions),links:historyLink(kind,`tenant:${t.id}`)}))};
}
const field=(name:string,label:string,extra:Partial<NativeActionField>={}):NativeActionField=>({name,label,type:"text",...extra});
const choices=(values:readonly string[])=>values.map(value=>({value,label:label(value)}));
export function nativeCrmPageActions(kind:MobileWorkspaceKind,path:string):NativeActionLink[]{return kind==="platform"&&path==="/platform/crm"?[{id:"crm.create",title:"New sales prospect"}]:[];}
export async function nativeCrmDefinition(session:AppSession,kind:MobileWorkspaceKind,path:string,actionId:string,token?:string):Promise<NativeActionDefinition|null>{
  if(!nativeCrmAllowed(session,kind,path)||!actionId.startsWith("crm."))return null;
  let target=await nativeCrmTarget(session,kind,token);
  let activity:Awaited<ReturnType<typeof prisma.crmActivity.findFirst>>=null;
  if(token?.startsWith("activity:")){
    activity=await prisma.crmActivity.findFirst({where:{...crmActivityScope(session,kind),id:token.slice(9)}});
    if(activity)target=await nativeCrmTarget(session,kind,activity.leadId?`lead:${activity.leadId}`:activity.tenantId?`tenant:${activity.tenantId}`:`organization:${activity.customerOrgId}`);
  }
  const make=(title:string,fields:NativeActionField[]):NativeActionDefinition=>({id:actionId,title,description:target?.title??"EstateDesk sales CRM",submitLabel:title,confirmation:`${title}${target?` for ${target.title}`:""}?`,groups:[{id:"crm",title,fields}]});
  const contactFields=(row?:{fullName:string;companyName:string;workEmail:string;phone:string|null;managedPropertyType:string;message:string|null})=>[field("fullName","Contact name",{required:true,maxLength:120,defaultValue:row?.fullName}),field("companyName","Organization name",{required:true,maxLength:160,defaultValue:row?.companyName}),field("workEmail","Work email",{type:"email",required:true,maxLength:160,defaultValue:row?.workEmail}),field("phone","Phone",{type:"phone",maxLength:40,defaultValue:row?.phone??""}),field("managedPropertyType","Portfolio type",{required:true,maxLength:100,defaultValue:row?.managedPropertyType}),field("message","Initial enquiry",{type:"multiline",maxLength:4000,defaultValue:row?.message??""})];
  if(actionId==="crm.create")return kind==="platform"&&path==="/platform/crm"?make("Create prospect",contactFields()):null;
  if(!target)return null;
  if(actionId==="crm.contact"||actionId==="crm.deal"){
    if(target.target!=="lead")return null;
    const row=await prisma.onboardingRequest.findUniqueOrThrow({where:{id:target.id},include:{customerOrg:{select:{id:true,name:true}}}});
    if(actionId==="crm.contact")return make("Save contact",[...contactFields(row),field("updatedAt","Revision",{type:"hidden",defaultValue:row.updatedAt.toISOString()})]);
    const owners=await platformOwners();
    return make("Save deal",[field("salesStage","Sales stage",{type:"select",required:true,defaultValue:row.salesStage,options:choices(stages)}),field("salesOwnerId","Sales owner",{type:"select",defaultValue:row.salesOwnerId??"",options:[{value:"",label:"Unassigned"},...owners.map(o=>({value:o.id,label:o.fullName}))]}),field("targetPlan","Target plan",{defaultValue:row.targetPlan??"",maxLength:80}),field("expectedMonthlyValue","Expected monthly value",{type:"decimal",defaultValue:row.expectedMonthlyValue?.toString()??""}),field("currencyCode","Currency",{defaultValue:row.currencyCode,required:true,maxLength:3}),field("demoAt","Demo appointment",{type:"datetime",defaultValue:row.demoAt?.toISOString()??""}),field("customerOrgId","Customer organization",{type:"organization",defaultValue:row.customerOrgId??"",options:row.customerOrg?[{value:row.customerOrg.id,label:row.customerOrg.name}]:[]}),field("lostReason","Lost reason",{type:"multiline",maxLength:1000,defaultValue:row.lostReason??""}),field("updatedAt","Revision",{type:"hidden",defaultValue:row.updatedAt.toISOString()})]);
  }
  if(actionId==="crm.complete")return activity&&!activity.completedAt&&activity.dueAt?make("Complete follow-up",[]):null;
  if(actionId==="crm.task"&&(!activity||activity.completedAt||!activity.dueAt||activity.subject==="Sales demo"))return null;
  if(actionId==="crm.activity"||actionId==="crm.task"){
    const owners=kind==="platform"?await platformOwners():await orgOwners(session.activeOrgId!);
    return make(actionId==="crm.task"?"Save follow-up":"Add activity",[field("kind","Activity type",{type:activity?"hidden":"select",defaultValue:activity?.kind??"NOTE",options:choices(["NOTE","CALL","EMAIL","DEMO","TASK"])}),field("body","Notes / next action",{type:"multiline",required:true,maxLength:4000,defaultValue:activity?.body}),field("priority","Priority",{type:"select",defaultValue:activity?.priority??"NORMAL",options:choices(["LOW","NORMAL","HIGH","URGENT"])}),field("assigneeId","Assigned to",{type:"select",defaultValue:activity?.assigneeId??"",options:[{value:"",label:"Unassigned"},...owners.map(o=>({value:o.id,label:o.fullName}))]}),field("dueAt","Due date",{type:"datetime",defaultValue:activity?.dueAt?.toISOString()??""})]);
  }
  if(actionId==="crm.send")return make("Send message",[field("channel","Channel",{type:"select",required:true,defaultValue:"EMAIL",options:[{value:"EMAIL",label:"Email"},...(target.target==="tenant"?[{value:"IN_APP",label:"Customer portal"}]:[])]}),field("subject","Subject",{required:true,maxLength:160}),field("body","Message",{type:"multiline",required:true,maxLength:4000}),field("requestKey","Message reference",{type:"hidden",defaultValue:randomUUID()})]);
  return null;
}
export async function executeNativeCrmAction(session:AppSession,kind:MobileWorkspaceKind,path:string,actionId:string,token:string|undefined,form:FormData){
  if(!await nativeCrmDefinition(session,kind,path,actionId,token))return {error:"This CRM action is unavailable."};
  let target=await nativeCrmTarget(session,kind,token);
  if(token?.startsWith("activity:")){
    const activity=await prisma.crmActivity.findFirst({where:{...crmActivityScope(session,kind),id:token.slice(9)}});
    if(!activity)return {error:"Follow-up unavailable."};
    target=await nativeCrmTarget(session,kind,activity.leadId?`lead:${activity.leadId}`:activity.tenantId?`tenant:${activity.tenantId}`:`organization:${activity.customerOrgId}`);
    form.set("activityId",activity.id);
  }
  if(actionId!=="crm.create"&&!target)return {error:"Customer unavailable."};
  if(target){form.set("target",target.target);form.set("targetId",target.id);if(target.target==="lead")form.set("leadId",target.id);}
  const handlers={"crm.create":createSalesLead,"crm.contact":updateLeadContact,"crm.deal":updateSalesLead,"crm.activity":addCrmActivity,"crm.complete":completeCrmActivity,"crm.task":updateCrmTask,"crm.send":sendCrmMessage};
  const handler=handlers[actionId as keyof typeof handlers];if(!handler)return {error:"Unknown CRM action."};
  const result=await handler({ok:false,message:""},form);
  return result.ok?{ok:true as const,message:result.message}:{error:result.message};
}
