import { isSameOriginBrowserMutation } from "@/lib/security/browser-origin";
import { cookies } from "next/headers";
import { clearUserSession } from "@/lib/auth/session";
import { GUEST_COOKIE } from "@/features/bnb/guest/session";

/** Revoke only the browser's current session without rendering a dashboard. */
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  if (request.headers.get("x-estatedesk-logout") !== "1" || !isSameOriginBrowserMutation(request)) {
    return Response.json({ error: "Same-origin request required." }, { status: 403, headers });
  }
  let scope: unknown;
  try { scope = (await request.json()).scope; } catch {
    return Response.json({ error: "Invalid request." }, { status: 400, headers });
  }
  if (scope !== "user" && scope !== "guest") {
    return Response.json({ error: "Invalid session scope." }, { status: 400, headers });
  }
  try {
    if (scope === "guest") (await cookies()).delete({ name: GUEST_COOKIE, path: "/guest-stay" });
    else await clearUserSession();
    return Response.json({ success: true }, { headers });
  } catch {
    return Response.json({ error: "Could not complete logout. Please try again." }, { status: 503, headers });
  }
}
