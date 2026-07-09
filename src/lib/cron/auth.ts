import "server-only";

import { getPlatformControl } from "@/lib/platform/control";

function readBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return undefined;
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : undefined;
}

export function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const token = readBearerToken(request);
  return token === secret;
}

/** Auth + website kill-switch gate for cron routes. */
export async function assertCronAllowed(request: Request) {
  if (!isCronAuthorized(request)) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" };
  }

  const control = await getPlatformControl();
  if (control.cronDisabled) {
    return {
      ok: false as const,
      status: 503 as const,
      error: "Cron disabled by platform control",
    };
  }

  return { ok: true as const };
}