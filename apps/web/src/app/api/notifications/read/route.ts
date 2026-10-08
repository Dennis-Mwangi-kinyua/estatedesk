import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/session";
import { readPersonalNotification, readAllPersonalNotifications } from "@/lib/notifications/read";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  // Cookie-authenticated mutation: only our own origin may acknowledge notifications.
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || (body.all !== true && typeof body.id !== "string")) return NextResponse.json({ error: "Missing notification." }, { status: 400 });
  try {
    const actionUrl = body.all === true ? (await readAllPersonalNotifications(session), null) : await readPersonalNotification(session, body.id);
    revalidatePath("/", "layout");
    return NextResponse.json({ actionUrl });
  } catch {
    return NextResponse.json({ error: "Unable to clear this notification." }, { status: 403 });
  }
}
