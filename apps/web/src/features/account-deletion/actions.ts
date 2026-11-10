"use server";
import { revalidatePath } from "next/cache";
import { requireUserSession } from "@/lib/auth/session";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { changeAccountDeletion,reviewAccountDeletion } from "./service";
export async function requestAccountDeletionAction(_state:{ok:boolean;message:string},form:FormData){
 const session=await requireUserSession();
 try{const action=form.get("operation")==="withdraw"?"withdraw":"request";await changeAccountDeletion(session.userId,session.activeOrgId,{action,confirmation:String(form.get("confirmation")??""),reason:String(form.get("reason")??"")});revalidatePath("/account-deletion");revalidatePath("/platform/privacy-requests");return {ok:true,message:action==="request"?"Deletion request submitted for identity and retention review.":"Deletion request withdrawn."};}
 catch{return {ok:false,message:"Could not update the request. Type DELETE MY ACCOUNT when submitting and check the current request status."};}
}
export async function reviewAccountDeletionAction(_state:{ok:boolean;message:string},form:FormData){
 const session=await requirePlatformRole(["SUPER_ADMIN","PLATFORM_ADMIN"]);
 const status=String(form.get("status")??"");
 if(!["IN_REVIEW","COMPLETED","DECLINED"].includes(status))return {ok:false,message:"Choose a valid review outcome."};
 try{const result=await reviewAccountDeletion(session.userId,String(form.get("userId")??""),status as "IN_REVIEW"|"COMPLETED"|"DECLINED",String(form.get("notes")??""));revalidatePath("/platform/privacy-requests");revalidatePath("/account-deletion");return result;}
 catch{return {ok:false,message:"Review could not be recorded. Check the request is open, add a review note, and complete account closure before marking completed."};}
}
