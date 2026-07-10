import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createRedirectMarkerCookieValue,
  getEphemeralCookieOptions,
  getRedirectMarkerCookieName,
} from "@/lib/auth/cookies";

export async function GET(request: Request) {
  const cookieStore = await cookies();

  cookieStore.set(
    getRedirectMarkerCookieName(),
    createRedirectMarkerCookieValue(),
    getEphemeralCookieOptions(5),
  );

  return NextResponse.redirect(new URL("/change-password", request.url));
}