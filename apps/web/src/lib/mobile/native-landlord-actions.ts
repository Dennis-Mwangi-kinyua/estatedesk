import "server-only";
import type { AppSession } from "@/lib/auth/session";
import type { MobileWorkspaceKind, NativeActionDefinition, NativeActionField, NativeActionLink } from "@estatedesk/contracts/mobile";
import { prisma } from "@/lib/prisma";
import { memberHasOrgPermission } from "@/lib/permissions/role-matrix";
import { createOrgLandlord,createPlatformLandlord,mapOrgLandlord,mapPlatformLandlord,manageOrgLandlord,managePlatformLandlord } from "@/features/landlords/actions";
const allowed=(s:AppSession,k:MobileWorkspaceKind)=>k==="platform"?["SUPER_ADMIN","PLATFORM_ADMIN"].includes(s.platformRole):k==="organization"&&!!s.activeOrgId&&s.membershipScope?.scopeType==="ORG"&&["ADMIN","MANAGER"].includes(s.activeOrgRole??"");
const field=(name:string,label:string,extra:Partial<NativeActionField>={}):NativeActionField=>({name,label,type:"text",...extra});
export function nativeLandlordPageActions(s:AppSession,k:MobileWorkspaceKind,path:string):NativeActionLink[]{return path.endsWith("/landlords")&&allowed(s,k)&&(k==="platform"||memberHasOrgPermission(s,"org.users.manage"))?[{id:"landlord.create",title:"Create landlord account"}]:[];}
export function nativeLandlordRecordActions(s:AppSession,k:MobileWorkspaceKind,active:boolean):NativeActionLink[]{
  if(!allowed(s,k))return [];
  return [...(active&&(k==="platform"||memberHasOrgPermission(s,"properties.manage"))?[{id:"landlord.map",title:"Assign properties"}]:[]),...(k==="platform"||memberHasOrgPermission(s,"org.users.manage")?[{id:active?"landlord.suspend":"landlord.reactivate",title:active?"Suspend landlord access":"Restore landlord access",destructive:active},...(active?[{id:"landlord.setup",title:"Reissue setup link"}]:[])]:[])];
}
export async function nativeLandlordDefinition(s:AppSession,k:MobileWorkspaceKind,path:string,action:string,id?:string):Promise<NativeActionDefinition|null>{
 if(!path.endsWith("/landlords")||!allowed(s,k)||!action.startsWith("landlord."))return null;
 const row=id?await prisma.landlordProfile.findFirst({where:{id,deletedAt:null,...(k==="organization"?{orgId:s.activeOrgId!}:{})},include:{assignments:{where:{active:true,endedAt:null,unitId:null}}}}):null;
 if(action!=="landlord.create"&&(!row||!nativeLandlordRecordActions(s,k,row.isActive).some(a=>a.id===action)))return null;
 if(action==="landlord.create"&&!nativeLandlordPageActions(s,k,path).length)return null;
 const orgId=row?.orgId??s.activeOrgId;
 const properties=orgId?await prisma.property.findMany({where:{orgId,deletedAt:null,isActive:true},select:{id:true,name:true},orderBy:{name:"asc"}}):[];
 const propertyField=field("propertyIds","Assigned properties",{type:"multiselect",defaultValue:JSON.stringify(row?.assignments.map(a=>a.propertyId).filter(Boolean)??[]),options:properties.map(p=>({value:p.id,label:p.name}))});
 const fields=action==="landlord.create"?[...(k==="platform"?[field("orgId","Organization",{type:"organization",required:true})]:[]),field("fullName","Full name",{required:true,maxLength:120}),field("username","Username",{required:true,maxLength:40}),field("email","Email",{type:"email",required:true,maxLength:180}),field("phone","Phone",{type:"phone",maxLength:40}),...(k==="organization"?[propertyField]:[field("propertyIds","Assigned properties",{type:"properties",organizationField:"orgId",required:true,defaultValue:"[]"})])]:action==="landlord.map"?[propertyField]:action==="landlord.setup"?[]:[field("reason","Reason",{required:true,type:"multiline",maxLength:1000})];
 const title=action==="landlord.create"?"Create landlord account":nativeLandlordRecordActions(s,k,row!.isActive).find(a=>a.id===action)!.title;
 return {id:action,title,description:row?.displayName??"The recipient chooses a password through a secure setup link.",submitLabel:title,confirmation:`${title}${row?` for ${row.displayName}`:""}?`,destructive:action==="landlord.suspend",groups:[{id:"landlord",title,fields}]};
}
export async function executeNativeLandlordAction(s:AppSession,k:MobileWorkspaceKind,path:string,action:string,id:string|undefined,form:FormData){
 if(!await nativeLandlordDefinition(s,k,path,action,id))return {error:"Landlord action unavailable."};
 const platform=k==="platform";
 if(action!=="landlord.create"){
   const row=await prisma.landlordProfile.findFirstOrThrow({where:{id,deletedAt:null,...(!platform?{orgId:s.activeOrgId!}:{})},select:{orgId:true,id:true}});
   form.set("orgId",row.orgId);form.set("landlordProfileId",row.id);
 }
 if(action.startsWith("landlord.")&&!["landlord.create","landlord.map"].includes(action))form.set("operation",action.slice(9));
 const fn=action==="landlord.create"?(platform?createPlatformLandlord:createOrgLandlord):action==="landlord.map"?(platform?mapPlatformLandlord:mapOrgLandlord):(platform?managePlatformLandlord:manageOrgLandlord);
 const result=await fn({},form);
 if(result.error)return {error:result.error};
 return {ok:true as const,message:result.success??"Landlord updated.",...(result.credentials?{credentials:{fullName:result.credentials.fullName,username:result.credentials.username,setupUrl:result.credentials.setupUrl,loginUrl:result.credentials.loginUrl,email:result.credentials.email,phone:result.credentials.phone}}:{})};
}
