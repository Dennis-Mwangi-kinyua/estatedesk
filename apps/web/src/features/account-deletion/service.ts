import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
export const deletionActions=["ACCOUNT_DELETION_REQUESTED","ACCOUNT_DELETION_WITHDRAWN","ACCOUNT_DELETION_REVIEWED"];
export function deletionStatus(row:{action:string;metadata:unknown}|null){
 if(!row)return "NONE";
 if(row.action==="ACCOUNT_DELETION_REQUESTED")return "REQUESTED";
 if(row.action==="ACCOUNT_DELETION_WITHDRAWN")return "WITHDRAWN";
 const metadata=row.metadata as {status?:string}|null;
 return metadata?.status??"IN_REVIEW";
}
export async function getAccountDeletion(userId:string){
 const row=await prisma.auditLog.findFirst({where:{entityType:"AccountDeletionRequest",entityId:userId,action:{in:deletionActions}},orderBy:[{createdAt:"desc"},{id:"desc"}],select:{action:true,metadata:true,createdAt:true}});
 return {status:deletionStatus(row),updatedAt:row?.createdAt.toISOString()??null};
}
export async function changeAccountDeletion(userId:string,orgId:string|null,input:{action:"request"|"withdraw";confirmation?:string;reason?:string}){
 if(input.action==="request"&&input.confirmation!=="DELETE MY ACCOUNT")throw new Error("Type DELETE MY ACCOUNT to confirm the request.");
 return prisma.$transaction(async tx=>{
   await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${userId} FOR UPDATE`;
   const previous=await tx.auditLog.findFirst({where:{entityType:"AccountDeletionRequest",entityId:userId,action:{in:deletionActions}},orderBy:[{createdAt:"desc"},{id:"desc"}],select:{action:true,metadata:true}});
   const status=deletionStatus(previous);
   if(input.action==="request"&&["REQUESTED","IN_REVIEW"].includes(status))return {status};
   if(input.action==="withdraw"&&!["REQUESTED","IN_REVIEW"].includes(status))throw new Error("No open deletion request is available to withdraw.");
   const action=input.action==="request"?"ACCOUNT_DELETION_REQUESTED":"ACCOUNT_DELETION_WITHDRAWN";
   await tx.auditLog.create({data:{orgId:null,actorUserId:userId,entityType:"AccountDeletionRequest",entityId:userId,action,metadata:{requestOrgId:orgId,reason:(input.reason??"").trim().slice(0,1000)}}});
   return {status:input.action==="request"?"REQUESTED":"WITHDRAWN"};
 });
}
export async function listAccountDeletions(q:string,page:number){
 const contains={contains:q,mode:"insensitive" as const};
 const matches=q?await prisma.user.findMany({where:{OR:[{fullName:contains},{email:contains}]},select:{id:true}}):null;
 const rows=await prisma.auditLog.findMany({where:{entityType:"AccountDeletionRequest",action:{in:deletionActions},...(matches?{entityId:{in:matches.map(u=>u.id)}}:{})},distinct:["entityId"],orderBy:[{entityId:"asc"},{createdAt:"desc"},{id:"desc"}],skip:(page-1)*25,take:26,select:{entityId:true,action:true,metadata:true,createdAt:true,actor:{select:{fullName:true,email:true,status:true,deletedAt:true}}}});
 const users=await prisma.user.findMany({where:{id:{in:rows.map(row=>row.entityId)}},select:{id:true,fullName:true,email:true,status:true,deletedAt:true}});
 return rows.map(row=>({...row,actor:users.find(user=>user.id===row.entityId)??{fullName:"Deleted account",email:null,status:"DISABLED",deletedAt:new Date()}}));
}
export async function reviewAccountDeletion(actorUserId:string,userId:string,status:"IN_REVIEW"|"COMPLETED"|"DECLINED",notes:string){
 if(notes.trim().length<10||notes.length>2000)throw new Error("Provide a review note of 10–2,000 characters.");
 return prisma.$transaction(async(tx:Prisma.TransactionClient)=>{
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${userId} FOR UPDATE`;
  const user=await tx.user.findUniqueOrThrow({where:{id:userId},select:{status:true,deletedAt:true}});
  const previous=await tx.auditLog.findFirst({where:{entityType:"AccountDeletionRequest",entityId:userId,action:{in:deletionActions}},orderBy:[{createdAt:"desc"},{id:"desc"}],select:{action:true,metadata:true}});
  if(!["REQUESTED","IN_REVIEW"].includes(deletionStatus(previous)))throw new Error("This deletion request is no longer open.");
  if(status==="COMPLETED"&&(!user.deletedAt||user.status==="ACTIVE"))throw new Error("Complete the approved account closure and retention review before marking this request completed.");
  await tx.auditLog.create({data:{orgId:null,actorUserId,entityType:"AccountDeletionRequest",entityId:userId,action:"ACCOUNT_DELETION_REVIEWED",metadata:{status,notes:notes.trim()}}});
  return {ok:true as const,message:"Deletion request review recorded."};
 });
}
