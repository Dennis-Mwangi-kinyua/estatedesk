import {z} from "zod";
import {nativeRoute,nativeBody} from "@/lib/mobile/route";
import {mobileJson} from "@/lib/mobile/api";
import {getAccountDeletion,changeAccountDeletion} from "@/features/account-deletion/service";
const schema=z.object({action:z.enum(["request","withdraw"]),confirmation:z.string().max(40).optional(),reason:z.string().trim().max(1000).optional()});
export async function GET(request:Request){return nativeRoute(request,async session=>mobileJson(await getAccountDeletion(session.userId)),{setup:true});}
export async function POST(request:Request){return nativeRoute(request,async session=>{const input=await nativeBody(request,schema);if(input.action==="request"&&input.confirmation!=="DELETE MY ACCOUNT")return mobileJson({error:"Type DELETE MY ACCOUNT to submit the request."},400);try{return mobileJson({ok:true,...await changeAccountDeletion(session.userId,session.activeOrgId,input)});}catch{return mobileJson({error:"Unable to update this request. Refresh its status before trying again."},400);}},{setup:true});}
