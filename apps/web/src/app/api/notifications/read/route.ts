import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/session";
import { readPersonalNotification, readAllPersonalNotifications } from "@/lib/notifications/read";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PayloadTooLargeError, readBoundedJson } from "@/lib/security/bounded-json";

const readTargetSchema = z.union([
  z.object({ all: z.literal(true) }).strict(),
  z.object({ id: z.string().trim().min(1).max(200) }).strict(),
]);

export async function POST(request: NextRequest) {
  // Cookie-authenticated mutation: only our own origin may acknowledge notifications.
  if (request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  let payload: unknown;
  try {
    payload = await readBoundedJson(request, 1024);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof PayloadTooLargeError ? "Payload too large." : "Invalid JSON." },
      { status: error instanceof PayloadTooLargeError ? 413 : 400 },
    );
  }
  const parsed = readTargetSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid notification target." }, { status: 400 });
  const body = parsed.data;
  try {
    const actionUrl = "all" in body ? (await readAllPersonalNotifications(session), null) : await readPersonalNotification(session, body.id);
    const portal = session.activeOrgRole === "TENANT" ? "tenant" : session.activeOrgRole === "CARETAKER" ? "caretaker" : "org";
    revalidatePath(`/dashboard/${portal}/notifications`);
    return NextResponse.json({ actionUrl });
  } catch {
    return NextResponse.json({ error: "Unable to clear this notification." }, { status: 403 });
  }
}
