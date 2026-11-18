import { z } from "zod";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { customerSupport, SupportError } from "@/features/customer-support";
const command = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("create"), subject: z.string().max(160), category: z.string().max(30), body: z.string().max(4000) }),
  z.object({ operation: z.literal("reply"), ticketId: z.string().min(1).max(100), body: z.string().max(4000) }),
  z.object({ operation: z.literal("resolve"), ticketId: z.string().min(1).max(100) }),
]);
export async function GET(request: Request) {
  return nativeRoute(request, async actor => {
    const query = new URL(request.url).searchParams;
    const id = query.get("ticketId");
    if (id) {
      const ticket = await customerSupport.find(actor, id);
      return ticket ? mobileJson({ ticket }) : mobileJson({ error: "Request unavailable." }, 404);
    }
    return mobileJson({ tickets: await customerSupport.list(actor, Number(query.get("page") ?? 1)) });
  });
}
export async function POST(request: Request) {
  return nativeRoute(request, async actor => {
    const input = await nativeBody(request, command);
    try {
      if (input.operation === "create") return mobileJson({ ticketId: await customerSupport.create(actor, input) }, 201);
      if (input.operation === "reply") await customerSupport.reply(actor, input);
      else await customerSupport.resolve(actor, input.ticketId);
      return mobileJson({ ok: true });
    } catch (error) {
      if (error instanceof SupportError) return mobileJson({ error: error.message }, 400);
      throw error;
    }
  });
}
