import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/session";
import { resolveUnreadBadgeCount } from "@/lib/notifications/unread-count";

export const dynamic = "force-dynamic";

/**
 * App-badge polling is best-effort. Unauthenticated (or expired) sessions
 * return count 0 with HTTP 200 so public pages and background polls do not
 * spam the browser console with 401 noise.
 */
export async function GET() {
  const session = await getUserSession();

  if (!session?.userId) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const count = await resolveUnreadBadgeCount(session);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("[pwa/badge-count] failed to resolve unread count", error);
    return NextResponse.json({ count: 0 });
  }
}