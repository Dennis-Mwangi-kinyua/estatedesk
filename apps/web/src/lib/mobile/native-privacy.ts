import "server-only";
import type {AppSession} from "@/lib/auth/session";
import type {MobileWorkspaceKind,NativeActionDefinition,NativeWorkspaceRecord} from "@estatedesk/contracts/mobile";
import {listAccountDeletions,deletionStatus,getAccountDeletion} from "@/features/account-deletion/service";
import {reviewAccountDeletionAction} from "@/features/account-deletion/actions";
const allowed=(session:AppSession,kind:MobileWorkspaceKind,path:string)=>kind==="platform"&&path==="/platform/privacy-requests"&&["SUPER_ADMIN","PLATFORM_ADMIN"].includes(session.platformRole);
export async function nativePrivacyRecords(session:AppSession,kind:MobileWorkspaceKind,path:string,q:string,page:number){
 if(!allowed(session,kind,path))return {records:[] as NativeWorkspaceRecord[],notice:"Platform administrator access required."};
 const rows=await listAccountDeletions(q,page);
 return {records:rows.map(row=>{const status=deletionStatus(row);const meta=row.metadata as {reason?:string;notes?:string}|null;return {id:row.entityId,title:row.actor.fullName,status,subtitle:row.actor.email??"",fields:[{label:"Request status",value:status.replaceAll("_"," ")},{label:"Account status",value:row.actor.status},{label:"Notes",value:meta?.notes??meta?.reason??"—"},{label:"Updated",value:row.createdAt.toISOString()}],actions:["REQUESTED","IN_REVIEW"].includes(status)?[{id:"privacy.review",title:"Review deletion request"}]:[]};}),notice:"Complete identity and retention checks before closing the account. Completed reviews require an already disabled, deleted login."};
}
export async function nativePrivacyDefinition(session:AppSession,kind:MobileWorkspaceKind,path:string,action:string,id?:string):Promise<NativeActionDefinition|null>{
 if(!allowed(session,kind,path)||action!=="privacy.review"||!id)return null;
 if(!["REQUESTED","IN_REVIEW"].includes((await getAccountDeletion(id)).status))return null;
 return {id:action,title:"Review deletion request",description:"Check identity and required record retention. Mark completed only after account closure.",submitLabel:"Record review",confirmation:"Record this privacy request review?",groups:[{id:"review",title:"Review outcome",fields:[{name:"status",label:"Outcome",type:"select",required:true,defaultValue:"IN_REVIEW",options:["IN_REVIEW","DECLINED","COMPLETED"].map(value=>({value,label:value.replaceAll("_"," ")}))},{name:"notes",label:"Review notes",type:"multiline",required:true,maxLength:2000}]}]};
}
export async function executeNativePrivacyAction(session:AppSession,kind:MobileWorkspaceKind,path:string,action:string,id:string|undefined,form:FormData){
 if(!await nativePrivacyDefinition(session,kind,path,action,id))return {error:"This privacy request is no longer available."};form.set("userId",id!);const result=await reviewAccountDeletionAction({ok:false,message:""},form);return result.ok?{ok:true as const,message:result.message}:{error:result.message};
}
