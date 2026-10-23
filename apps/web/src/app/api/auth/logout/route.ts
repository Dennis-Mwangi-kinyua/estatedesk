import { cookies } from "next/headers";
import { clearUserSession } from "@/lib/auth/session";
import { GUEST_COOKIE } from "@/features/bnb/guest/session";

/** Revoke only the browser's current session without rendering a dashboard. */
export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  // Reverse proxies may expose an internal URL; match the browser-facing host.
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim()
    || request.headers.get("host") || new URL(request.url).host;
  let sameOrigin = false;
  try {
    const parsed = new URL(origin ?? "");
    sameOrigin = (parsed.protocol === "https:" || parsed.protocol === "http:") && parsed.host === host;
  } catch { /* Missing or malformed Origin is rejected below. */ }
  if (request.headers.get("x-estatedesk-logout") !== "1" ||
      !sameOrigin ||
      (fetchSite !== null && fetchSite !== "same-origin")) {
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
