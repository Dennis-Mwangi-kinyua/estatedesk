import { z } from "zod";
import { nativeBody, nativeRoute } from "@/lib/mobile/route";
import { mobileJson } from "@/lib/mobile/api";
import { prisma } from "@/lib/prisma";
import { updateProviderJob, declineProviderJob } from "@/features/providers/service";

const inputSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("accept"), jobId: z.string().min(1).max(100) }),
  z.object({ operation: z.literal("decline"), jobId: z.string().min(1).max(100) }),
  z.object({ operation: z.literal("submit"), jobId: z.string().min(1).max(100), completionNotes: z.string().trim().min(10).max(3000) }),
]);

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    const input = await nativeBody(request, inputSchema);
    const provider = await prisma.serviceProvider.findFirst({ where: { userId: session.userId, status: { in: ["ACTIVE", "FLAGGED"] } }, select: { id: true } });
    if (!provider) return mobileJson({ error: "An approved provider account is required." }, 403);
    try {
      if (input.operation === "decline") await declineProviderJob(provider.id, session.userId, input.jobId);
      else await updateProviderJob(provider.id, session.userId, input.jobId, input.operation, input.operation === "submit" ? input.completionNotes : undefined);
      return mobileJson({ ok: true });
    } catch {
      // Neither record existence nor internal errors are disclosed to another provider.
      return mobileJson({ error: "The job could not be updated. Refresh its status before trying again." }, 409);
    }
  });
}
