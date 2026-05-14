import "server-only";

import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import type {
  OrgRole,
  PlatformRole,
  ScopeType,
} from "@prisma/client";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionHeartbeatBefore } from "@/lib/auth/presence";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";

export type { OrgRole, PlatformRole, ScopeType };

export type AppSession = {
  userId: string;
  email: string | null;
  fullName: string;
  platformRole: PlatformRole;
  activeOrgId: string | null;
  activeOrgRole: OrgRole | null;
  mustChangePassword: boolean;
  membershipScope:
    | {
        scopeType: ScopeType;
        scopeId: string;
      }
    | null;
};

type SetUserSessionInput = {
  userId: string;
  activeMembershipId?: string | null;
  remember?: boolean;
};

const SESSION_COOKIE_NAME = "estatedesk_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
const REMEMBERED_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const ENFORCE_USER_AGENT_MATCH = false;
const ENFORCE_IP_MATCH = false;

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getSessionMaxAgeSeconds(remember?: boolean): number {
  return remember ? REMEMBERED_SESSION_MAX_AGE_SECONDS : SESSION_MAX_AGE_SECONDS;
}

function getSessionExpiryDate(remember?: boolean): Date {
  return new Date(Date.now() + getSessionMaxAgeSeconds(remember) * 1000);
}

function getIpFromHeaderValue(forwardedFor: string | null): string | null {
  if (!forwardedFor) return null;
  return forwardedFor.split(",")[0]?.trim() || null;
}

async function getRequestMeta() {
  const headerStore = await headers();

  const forwardedFor = headerStore.get("x-forwarded-for");
  const realIp = headerStore.get("x-real-ip");
  const ipAddress = getIpFromHeaderValue(forwardedFor) ?? realIp ?? null;
  const userAgent = headerStore.get("user-agent");

  return { ipAddress, userAgent };
}

function getCookieOptions(
  overrides?: Partial<{
    maxAge: number;
    expires: Date;
  }>,
) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...overrides,
  };
}

function setSessionCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  token: string,
  remember?: boolean,
) {
  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    getCookieOptions({ maxAge: getSessionMaxAgeSeconds(remember) }),
  );
}

function clearCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.set(
    SESSION_COOKIE_NAME,
    "",
    getCookieOptions({ expires: new Date(0) }),
  );
}

async function resolveMembershipForSession(
  userId: string,
  activeMembershipId?: string | null,
) {
  if (activeMembershipId === null) {
    return null;
  }

  if (activeMembershipId) {
    const membership = await prisma.membership.findFirst({
      where: {
        id: activeMembershipId,
        userId,
      },
    });

    if (!membership) {
      throw new Error("Selected membership does not belong to the user.");
    }

    return membership;
  }

  return prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function setUserSession({
  userId,
  activeMembershipId,
  remember = false,
}: SetUserSessionInput): Promise<void> {
  const cookieStore = await cookies();
  const { ipAddress, userAgent } = await getRequestMeta();

  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiryDate(remember);

  const membership = await resolveMembershipForSession(userId, activeMembershipId);

  await prisma.$transaction(async (tx) => {
    await tx.userSession.deleteMany({
      where: { userId },
    });

    await tx.userSession.create({
      data: {
        userId,
        tokenHash,
        ipAddress,
        userAgent,
        expiresAt,
        activeMembershipId: membership?.id ?? null,
      },
    });
  });

  setSessionCookie(cookieStore, token, remember);
}

export const getUserSession = cache(async function getUserSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  try {
    const dbSession = await retryTransientDatabaseOperation(
      () =>
        prisma.userSession.findUnique({
          where: { tokenHash },
          include: {
            user: true,
            activeMembership: true,
          },
        }),
      { label: "getUserSession-find-session" },
    );

    if (!dbSession) return null;
    if (dbSession.expiresAt <= new Date()) return null;

    const user = dbSession.user;

    if (user.status !== "ACTIVE" || user.deletedAt !== null) {
      return null;
    }

    const now = new Date();

    if (dbSession.lastSeenAt < getSessionHeartbeatBefore(now)) {
      await retryTransientDatabaseOperation(
        () =>
          prisma.userSession.updateMany({
            where: {
              tokenHash,
              lastSeenAt: {
                lt: getSessionHeartbeatBefore(now),
              },
            },
            data: {
              lastSeenAt: now,
            },
          }),
        { label: "getUserSession-heartbeat" },
      );
    }

    const { ipAddress, userAgent } = await getRequestMeta();

    if (
      ENFORCE_IP_MATCH &&
      dbSession.ipAddress &&
      ipAddress &&
      dbSession.ipAddress !== ipAddress
    ) {
      return null;
    }

    if (
      ENFORCE_USER_AGENT_MATCH &&
      dbSession.userAgent &&
      userAgent &&
      dbSession.userAgent !== userAgent
    ) {
      return null;
    }

    const activeMembership = dbSession.activeMembership;

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      platformRole: user.platformRole,
      mustChangePassword: user.mustChangePassword,
      activeOrgId: activeMembership?.orgId ?? null,
      activeOrgRole: activeMembership?.role ?? null,
      membershipScope: activeMembership
        ? {
            scopeType: activeMembership.scopeType,
            scopeId: activeMembership.scopeId,
          }
        : null,
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientInitializationError ||
      error instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      console.error("getUserSession prisma error:", error);
      return null;
    }

    console.error("getUserSession unexpected error:", error);
    return null;
  }
});

export async function clearUserSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);

    await prisma.userSession.deleteMany({
      where: { tokenHash },
    });
  }

  clearCookie(cookieStore);
}

export async function switchActiveMembership(
  membershipId: string,
): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect("/login");
  }

  const tokenHash = hashSessionToken(token);

  const dbSession = await prisma.userSession.findUnique({
    where: { tokenHash },
    include: {
      user: true,
    },
  });

  if (!dbSession) {
    clearCookie(cookieStore);
    redirect("/login");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      userId: dbSession.userId,
    },
  });

  if (!membership) {
    throw new Error("Membership not found for this user.");
  }

  const now = new Date();
  const remainingSeconds = Math.max(
    1,
    Math.floor((dbSession.expiresAt.getTime() - now.getTime()) / 1000),
  );

  await prisma.userSession.update({
    where: { tokenHash },
    data: {
      activeMembershipId: membership.id,
      lastSeenAt: now,
    },
  });

  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    getCookieOptions({ maxAge: remainingSeconds }),
  );
}

export async function requireUserSession(): Promise<AppSession> {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
