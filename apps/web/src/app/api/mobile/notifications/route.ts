import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notificationScopeForSession, readPersonalNotification } from "@/lib/notifications/read";
import { mobileJson } from "@/lib/mobile/api";
import { nativeRoute, nativeBody } from "@/lib/mobile/route";

export async function GET(request: Request) {
  return nativeRoute(request, async session => {
    if (!session.activeOrgId) return mobileJson([]);
    const scope = await notificationScopeForSession(session);
    const items = await prisma.notification.findMany({ where: { ...scope, channel: "IN_APP", status: "SENT" }, select: { id: true, title: true, message: true, readAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 });
    return mobileJson(items.map(item => ({ ...item, createdAt: item.createdAt.toISOString(), readAt: item.readAt?.toISOString() ?? null })));
  });
}

export async function POST(request: Request) {
  return nativeRoute(request, async session => {
    const { id } = await nativeBody(request, z.object({ id: z.string().min(1).max(200) }));
    const scope = await notificationScopeForSession(session);
    if (!await prisma.notification.findFirst({ where: { ...scope, id }, select: { id: true } })) return mobileJson({ error: "Notification unavailable." }, 404);
    await readPersonalNotification(session, id);
    return mobileJson({ ok: true });
  });
}
