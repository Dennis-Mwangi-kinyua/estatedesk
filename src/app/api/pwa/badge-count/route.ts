import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/session";
import { resolveUnreadBadgeCount } from "@/lib/notifications/unread-count";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getUserSession();

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await resolveUnreadBadgeCount(session);

  return NextResponse.json({ count });
}