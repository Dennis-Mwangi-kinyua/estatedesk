import "server-only";
import { randomUUID } from "node:crypto";
import type { AppSession } from "@/lib/auth/session";
import type { MobileWorkspaceKind, NativeActionDefinition, NativeActionField, NativeWorkspaceRecord } from "@estatedesk/contracts/mobile";
import { collectionsData } from "@/features/collections/queries";
import { assignCollectionFollowUp, approveCollectionReminder, completeCollectionFollowUp } from "@/features/collections/service";
import { canAccessWorkspacePath } from "@/lib/permissions/workspace-access";
import { requireActiveSubscription } from "@/lib/billing/subscription-access";
import { createPromise, resolvePromise } from "@/features/org-management/service";
import { ManagementError } from "@/features/org-management/policy";
import { ZodError } from "zod";
export const COLLECTION_PATH="/dashboard/org/collections";
const date=(v:string)=>new Intl.DateTimeFormat("en-KE",{dateStyle:"medium",timeZone:"Africa/Nairobi"}).format(new Date(v));
async function dataFor(session:AppSession,query:{q?:string;view?:string;page?:string;tenantId?:string}) { await requireActiveSubscription(session.activeOrgId!);return collectionsData(session,query,new Date(),true); }
export async function nativeCollectionRecords(session:AppSession,q:string,page:number){
 const data=await dataFor(session,{...(q.startsWith("view:")?{view:q.slice(5)}:{q}),page:String(page)});
 const money=(v:number)=>new Intl.NumberFormat("en-KE",{style:"currency",currency:data.currency}).format(v);
 const records:NativeWorkspaceRecord[]=data.rows.map(row=>({id:row.id,title:row.name,subtitle:row.leases.map(l=>l.label).join(" · "),status:row.reviews?"PAYMENT_REVIEW":row.broken?"MISSED_PROMISE":row.owner?"ASSIGNED":"NEEDS_OWNER",fields:[
  {label:"Overdue rent",value:money(row.balance)},{label:"Oldest rent due",value:date(row.oldestDue)},{label:"Phone",value:row.phone||"—"},
  {label:"Follow-up",value:row.tasks.map(t=>`${t.owner} · ${t.dueAt?date(t.dueAt):"No date"}: ${t.body}`).join("\n")||(row.owner?`Promise follow-up: ${row.owner} · ${row.nextContactAt?date(row.nextContactAt):"date needed"}`:"Assign an owner and next contact date")},
  {label:"Payment reviews",value:String(row.reviews)},{label:"Promises",value:row.promises.map(p=>`${money(p.amount)} by ${date(p.dueAt)} · ${p.status} · paid ${money(p.received)}`).join("\n")||"No open promise"},
  {label:"Recent reminders",value:row.notifications.map(n=>`${date(n.createdAt)} · ${n.channel} · ${n.status}`).join("\n")||"No recent reminders in this view"}],
  actions:[{id:"collection.assign",title:"Assign or reschedule follow-up"},{id:"collection.promise",title:"Record a payment promise"},...(row.promises.length?[{id:"collection.resolvePromise",title:"Record promise outcome"}]:[]),...(row.tasks.length?[{id:"collection.complete",title:"Mark contacted"}]:[]),...(row.reviews===0&&(row.email||row.userId)&&canAccessWorkspacePath(session,"/dashboard/org/notifications")?[{id:"collection.remind",title:"Preview and approve reminder"}]:[])],
 }));
 return {records,notice:`${data.date} · Overdue ${money(data.overdue)} across ${data.accounts} accounts. Rent collected today ${money(data.collectedToday)}; this month ${money(data.collectedMonth)}. ${data.keptPromises} promises recorded fulfilled this month. Check pending/unmatched payments before chasing a tenant. Amounts exclude water, deposits and unapplied cash.`};
}
export async function nativeCollectionDefinition(session:AppSession,kind:MobileWorkspaceKind,path:string,id:string,tenantId?:string):Promise<NativeActionDefinition|null>{
 if(kind!=="organization"||path!==COLLECTION_PATH||!tenantId||!["collection.assign","collection.complete","collection.remind","collection.promise","collection.resolvePromise"].includes(id))return null;
 const data=await dataFor(session,{tenantId});const row=data.rows[0];if(!row)return null;
 const field=(name:string,label:string,extra:Partial<NativeActionField>={}):NativeActionField=>({name,label,type:"text",...extra});
 let fields:NativeActionField[]=[];let title="";let description=row.name;
 if(id==="collection.assign"){title="Save collection follow-up";fields=[field("assigneeId","Follow-up owner",{type:"select",required:true,options:data.staff.map(s=>({value:s.id,label:s.name}))}),field("date","Next contact date (Nairobi)",{type:"date",required:true}),field("note","Next step / contact notes (at least 5 characters)",{type:"multiline",required:true,maxLength:2000}),field("requestKey","Submission",{type:"hidden",defaultValue:randomUUID()})];}
 if(id==="collection.promise"){title="Record payment promise";fields=[field("leaseId","Tenant lease",{type:"select",required:true,options:row.leases.map(l=>({value:l.id,label:l.label}))}),field("assigneeId","Follow-up owner",{type:"select",required:true,options:data.staff.map(s=>({value:s.id,label:s.name}))}),field("amount",`Promised amount (${data.currency})`,{type:"decimal",required:true}),field("dueDate","Promise due date (Nairobi)",{type:"date",required:true}),field("followUpDate","Follow-up date (Nairobi)",{type:"date",required:true}),field("notes","Agreement notes (at least 5 characters)",{type:"multiline",required:true,maxLength:2000})];}
 if(id==="collection.resolvePromise"){if(!row.promises.length)return null;title="Record promise outcome";description=`${row.name}. Fulfilment requires allocated payment progress. A broken outcome requires an expired promise.`;fields=[field("id","Payment promise",{type:"select",required:true,options:row.promises.map(p=>({value:p.id,label:`${p.amount} by ${date(p.dueAt)} · ${p.status}`}))}),field("status","Outcome",{type:"select",required:true,options:[{value:"FULFILLED",label:"Fulfilled (verified payment required)"},{value:"BROKEN",label:"Broken (after due date)"},{value:"CANCELLED",label:"Cancel / replace"}]}),field("note","Outcome note",{type:"multiline",required:true,maxLength:2000})];}
 if(id==="collection.complete"){if(!row.tasks.length)return null;title="Mark contacted";fields=[field("id","Follow-up",{type:"hidden",defaultValue:row.tasks[0].id})];}
 if(id==="collection.remind"){
  if(row.reviews||(!row.email&&!row.userId)||!canAccessWorkspacePath(session,"/dashboard/org/notifications"))return null;
  title="Approve rent reminder";description=`${row.name}\n\n${row.reminder}\n\nEmail is queued for the configured dispatcher. Sent does not prove the recipient has read it.`;
  fields=[field("channel","Deliver to",{type:"select",required:true,options:[...(row.userId?[{value:"IN_APP",label:"Tenant portal"}]:[]),...(row.email?[{value:"EMAIL",label:row.email}]:[])]}),field("version","Preview version",{type:"hidden",defaultValue:row.version}),field("requestKey","Submission",{type:"hidden",defaultValue:randomUUID()}),field("approved","I reviewed the balance, recipient and message and approve sending it",{type:"checkbox",required:true})];
 }
 return {id,title,description,submitLabel:title,confirmation:`${title} for ${row.name}?`,groups:[{id:"collection",title,fields}]};
}
export async function executeNativeCollectionAction(session:AppSession,kind:MobileWorkspaceKind,path:string,id:string,tenantId:string|undefined,form:FormData){
 if(kind!=="organization"||path!==COLLECTION_PATH||!tenantId)return {error:"Collection account unavailable."};
 await requireActiveSubscription(session.activeOrgId!);
 try{
  if(id==="collection.assign")await assignCollectionFollowUp(session,{...Object.fromEntries(form),tenantId});
  else if(id==="collection.remind")await approveCollectionReminder(session,{...Object.fromEntries(form),tenantId,approved:form.get("approved")==="on"?"yes":""});
  else if(id==="collection.promise"){
    const data=await dataFor(session,{tenantId});if(!data.rows[0]?.leases.some(l=>l.id===form.get("leaseId")))return {error:"Lease unavailable for this account."};
    await createPromise(session,Object.fromEntries(form));
  }
  else if(id==="collection.resolvePromise"){
    const data=await dataFor(session,{tenantId});if(!data.rows[0]?.promises.some(p=>p.id===form.get("id")))return {error:"Promise unavailable for this account."};
    await resolvePromise(session,String(form.get("id")),String(form.get("status")),String(form.get("note")));
  }
  else if(id==="collection.complete"){
    const data=await dataFor(session,{tenantId});if(!data.rows[0]?.tasks.some(t=>t.id===form.get("id")))return {error:"Follow-up unavailable for this account."};
    await completeCollectionFollowUp(session,String(form.get("id")));
  }else return {error:"Unknown collection action."};
  return {ok:true,message:id==="collection.remind"?"Reminder approved. Email is queued; portal messages are available immediately.":"Collection follow-up saved."};
 }catch(error){if(error instanceof ManagementError)return {error:error.message};if(error instanceof ZodError)return {error:error.issues[0].message};throw error;}
}
