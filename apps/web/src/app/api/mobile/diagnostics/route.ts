import {z} from "zod";
import {nativeRoute,nativeBody} from "@/lib/mobile/route";
import {mobileJson} from "@/lib/mobile/api";
import {prisma} from "@/lib/prisma";
const schema=z.object({eventId:z.string().uuid(),fingerprint:z.string().regex(/^[a-f0-9]{64}$/),platform:z.enum(["ios","android"]),version:z.string().regex(/^[0-9A-Za-z.+-]{1,40}$/),kind:z.literal("react-render")});
export async function POST(request:Request){return nativeRoute(request,async session=>{const input=await nativeBody(request,schema);await prisma.auditLog.create({data:{orgId:session.activeOrgId,actorUserId:session.userId,action:"NATIVE_RENDER_ERROR",entityType:"MobileDiagnostic",entityId:input.eventId,metadata:input}});return mobileJson({ok:true});},{setup:true});}
