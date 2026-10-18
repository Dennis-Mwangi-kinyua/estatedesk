import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionCookieName, getSessionCookieOptions } from "@/lib/auth/cookies";
import { mobileJson } from "./api";

/** target must be an exact, authorized menu entry selected by the caller. */
export async function mobilePortalResponse(target: string) {
  const name = getSessionCookieName();
  const value = (await cookies()).get(name)?.value;
  if (!value) return mobileJson({ error: "Please sign in again." }, 401);
  const response = new NextResponse(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="0;url=${target}"></head><body><a href="${target}">Continue to your workspace</a></body></html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY",
      "Content-Security-Policy": "default-src 'none'; base-uri 'none'; frame-ancestors 'none'", Vary: "Cookie",
    },
  });
  response.cookies.set(name, value, getSessionCookieOptions(60 * 60 * 24 * 30));
  return response;
}
