import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionId } from "@/lib/auth/session";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";

const registration = z.object({ token: z.string().regex(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/).max(200), platform: z.enum(["ios", "android"]) });
export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    if (process.env.NATIVE_PUSH_ENABLED !== "true") return mobileJson({ error: "Native push is not enabled on this server." }, 503);
    const input = await nativeBody(request, registration);
    const sessionId = await getCurrentSessionId();
    if (!sessionId || !session.activeOrgId) return mobileJson({ error: "Organization login required." }, 403);
    await prisma.nativePushDevice.upsert({ where: { token: input.token }, create: { ...input, sessionId, orgId: session.activeOrgId }, update: { sessionId, orgId: session.activeOrgId, platform: input.platform, createdAt: new Date() } });
    return mobileJson({ ok: true });
  });
}
export async function DELETE(request: Request) {
  return nativeRoute(request, async () => {
    const sessionId = await getCurrentSessionId();
    if (sessionId) await prisma.nativePushDevice.deleteMany({ where: { sessionId } });
    return mobileJson({ ok: true });
  }, { setup: true });
}
