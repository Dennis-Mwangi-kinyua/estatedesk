import "server-only";

import { cookies } from "next/headers";
import {
  createSupportSessionCookieValue,
  getSupportSessionCookieName,
  parseSupportSessionCookieValue,
} from "@/lib/auth/cookies";
import { getEphemeralCookieOptions } from "@/lib/auth/cookie-policy";

export const SUPPORT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 2; // 2 hours

export type SupportSession = {
  userId: string;
  orgId: string;
  orgSlug: string;
  orgName: string;
  membershipId: string;
  reason: string;
  expiresAtUnix: number;
};

export async function getActiveSupportSession(
  userId?: string,
): Promise<SupportSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(getSupportSessionCookieName())?.value;
  const session = parseSupportSessionCookieValue(raw);
  if (!session) return null;
  if (userId && session.userId !== userId) return null;
  return session;
}

export async function setSupportSessionCookie(session: SupportSession) {
  const cookieStore = await cookies();
  cookieStore.set(
    getSupportSessionCookieName(),
    createSupportSessionCookieValue(session),
    getEphemeralCookieOptions(SUPPORT_SESSION_MAX_AGE_SECONDS),
  );
}

export async function clearSupportSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(getSupportSessionCookieName());
}

export function supportSessionRemainingMinutes(session: SupportSession) {
  const remaining = session.expiresAtUnix - Math.floor(Date.now() / 1000);
  return Math.max(0, Math.ceil(remaining / 60));
}
