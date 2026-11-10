"use server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireOrgManagement } from "@/features/org-management/access";
import { ManagementError } from "@/features/org-management/policy";
import { safeServerActionError } from "@/lib/errors/server-error-log";
import { assignCollectionFollowUp, approveCollectionReminder, completeCollectionFollowUp } from "./service";
export type CollectionState = { error?:string; message?:string };
export async function collectionAction(_state: CollectionState, form: FormData): Promise<CollectionState> {
  const session=await requireOrgManagement("collections");const op=String(form.get("operation")??"");
  try {
    const input=Object.fromEntries(form);
    if(op==="assign")await assignCollectionFollowUp(session,input);
    else if(op==="complete")await completeCollectionFollowUp(session,String(form.get("id")??""));
    else if(op==="remind")await approveCollectionReminder(session,input);
    else return {error:"Unknown collection action."};
    for(const path of ["/dashboard/org/collections","/dashboard/org/crm/tasks","/dashboard/org/notifications","/dashboard/today"])revalidatePath(path);
    return {message:op==="remind"?"Reminder approved. Portal messages are available immediately; email is queued for delivery.":"Follow-up saved."};
  }catch(error){return {error:error instanceof ManagementError?error.message:error instanceof ZodError?error.issues[0].message:safeServerActionError("collections",error,"Could not save. Refresh and try again.")};}
}
