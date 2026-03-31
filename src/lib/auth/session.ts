import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type PlatformRole = "USER" | "SUPER_ADMIN" | "PLATFORM_ADMIN";
export type OrgRole =
  | "ADMIN"
  | "MANAGER"
  | "OFFICE"
  | "ACCOUNTANT"
  | "CARETAKER"
  | "TENANT";

export type ScopeType = "ORG" | "PROPERTY" | "BUILDING" | "UNIT";

export type AppSession = {
  userId: string;
  email: string | null;
  fullName: string;
  platformRole: PlatformRole;
  activeOrgId: string | null;
  activeOrgRole: OrgRole | null;
  membershipScope:
    | {
        scopeType: ScopeType;
        scopeId: string;
      }
    | null;
};

const SESSION_COOKIE_NAME = "estatedesk_session";

export async function setUserSession(session: AppSession) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getUserSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!raw) return null;

  try {
    return JSON.parse(raw) as AppSession;
  } catch {
    return null;
  }
}

export async function clearUserSession() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function requireUserSession(): Promise<AppSession> {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}