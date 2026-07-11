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
import {
  createSessionCookieValue,
  getSessionCookieName,
  getSessionCookieOptions,
  parseSessionCookieValue,
} from "@/lib/auth/cookies";
import { getSessionHeartbeatBefore } from "@/lib/auth/presence";
import { hashOpaqueToken, legacyHashOpaqueToken } from "@/lib/crypto/tokens";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { isSecurityGatePathname } from "@/lib/auth/security-gate";
import { prisma } from "@/lib/prisma";

export type { OrgRole, PlatformRole, ScopeType };

export type AppSession = {
  userId: string;
  email: string | null;
  fullName: string;
  platformRole: PlatformRole;
  activeOrgId: string | null;
  activeOrgRole: OrgRole | null;
  mustChangePassword: boolean;
  requiresTermsAcceptance: boolean;
  membershipScope:
    | {
        scopeType: ScopeType;
        scopeId: string;
      }
    | null;
};

export type ManagedUserSession = {
  id: string;
  createdAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  isCurrent: boolean;
};

type SetUserSessionInput = {
  userId: string;
  activeMembershipId?: string | null;
  replaceExistingSessions?: boolean;
};

export class ActiveSessionLimitError extends Error {
  constructor() {
    super(
      "Limit reached. This account is already signed in on two devices. Please log out from another device first.",
    );
    this.name = "ActiveSessionLimitError";
  }
}

const MAX_ACTIVE_SESSIONS_PER_USER = 2;
const SESSION_MAX_AGE_SECONDS = 60 * 30;
const SESSION_RENEWAL_THRESHOLD = 0.5;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function envFlagEnabled(name: string, defaultInProduction: boolean) {
  const raw = process.env[name]?.trim().toLowerCase();

  if (raw === "true" || raw === "1" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "no") return false;

  return isProduction() && defaultInProduction;
}

const ENFORCE_USER_AGENT_MATCH = envFlagEnabled("SESSION_BIND_USER_AGENT", true);
const ENFORCE_IP_MATCH = envFlagEnabled("SESSION_BIND_IP", true);

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashSessionToken(token: string): string {
  return hashOpaqueToken(token, "session");
}

function getSessionMaxAgeSeconds(): number {
  return SESSION_MAX_AGE_SECONDS;
}

function getSessionExpiryDate(): Date {
  return new Date(Date.now() + getSessionMaxAgeSeconds() * 1000);
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

async function readSessionTokenFromCookies() {
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName();
  const rawValue = cookieStore.get(cookieName)?.value;

  return {
    cookieStore,
    cookieName,
    token: parseSessionCookieValue(rawValue),
    rawValue,
  };
}

/**
 * Session cookie writes are best-effort during Server Component renders.
 * Next only allows cookie mutation in Server Actions / Route Handlers; any
 * failure here must never take down the RSC tree (production digests hide the
 * real "Cookies can only be modified..." message).
 */
function setSessionCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  token: string,
  maxAge = getSessionMaxAgeSeconds(),
) {
  try {
    cookieStore.set(
      getSessionCookieName(),
      createSessionCookieValue(token),
      getSessionCookieOptions(maxAge),
    );
  } catch {
    // Intentionally ignored — renewal/upgrade can complete on the next
    // mutable request (action/route) without breaking page render.
  }
}

function clearSessionCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  try {
    cookieStore.set(getSessionCookieName(), "", {
      ...getSessionCookieOptions(0),
      expires: new Date(0),
      maxAge: 0,
    });
  } catch {
    // Intentionally ignored — same RSC cookie-mutation constraint as set.
  }
}

async function findSessionByToken(token: string) {
  const primaryHash = hashSessionToken(token);
  const legacyHash = legacyHashOpaqueToken(token);

  const primarySession = await retryTransientDatabaseOperation(
    () =>
      prisma.userSession.findUnique({
        where: { tokenHash: primaryHash },
        select: {
          id: true,
          userId: true,
          ipAddress: true,
          userAgent: true,
          expiresAt: true,
          lastSeenAt: true,
          activeMembershipId: true,
          tokenHash: true,
        },
      }),
    { label: "findSessionByToken-primary" },
  );

  if (primarySession) {
    return { session: primarySession, tokenHash: primaryHash };
  }

  if (legacyHash === primaryHash) {
    return { session: null, tokenHash: primaryHash };
  }

  const legacySession = await retryTransientDatabaseOperation(
    () =>
      prisma.userSession.findUnique({
        where: { tokenHash: legacyHash },
        select: {
          id: true,
          userId: true,
          ipAddress: true,
          userAgent: true,
          expiresAt: true,
          lastSeenAt: true,
          activeMembershipId: true,
          tokenHash: true,
        },
      }),
    { label: "findSessionByToken-legacy" },
  );

  if (!legacySession) {
    return { session: null, tokenHash: primaryHash };
  }

  await retryTransientDatabaseOperation(
    () =>
      prisma.userSession.update({
        where: { id: legacySession.id },
        data: { tokenHash: primaryHash },
      }),
    { label: "findSessionByToken-upgrade-hash" },
  );

  return {
    session: { ...legacySession, tokenHash: primaryHash },
    tokenHash: primaryHash,
  };
}

function sessionBindingMatches(
  dbSession: {
    ipAddress: string | null;
    userAgent: string | null;
  },
  requestMeta: {
    ipAddress: string | null;
    userAgent: string | null;
  },
) {
  if (
    ENFORCE_IP_MATCH &&
    dbSession.ipAddress &&
    requestMeta.ipAddress &&
    dbSession.ipAddress !== requestMeta.ipAddress
  ) {
    return false;
  }

  if (
    ENFORCE_USER_AGENT_MATCH &&
    dbSession.userAgent &&
    requestMeta.userAgent &&
    dbSession.userAgent !== requestMeta.userAgent
  ) {
    return false;
  }

  return true;
}

async function invalidateStoredSession(input: {
  tokenHash: string;
  cookieStore: Awaited<ReturnType<typeof cookies>>;
}) {
  await prisma.userSession.deleteMany({
    where: { tokenHash: input.tokenHash },
  });

  clearSessionCookie(input.cookieStore);
}

async function getCurrentTokenHash() {
  const { token } = await readSessionTokenFromCookies();
  return token ? hashSessionToken(token) : null;
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
        employmentEndedAt: null,
      },
    });

    if (!membership) {
      throw new Error("Selected membership does not belong to the user.");
    }

    return membership;
  }

  return prisma.membership.findFirst({
    where: { userId, employmentEndedAt: null },
    orderBy: { createdAt: "asc" },
  });
}

export async function setUserSession({
  userId,
  activeMembershipId,
  replaceExistingSessions = false,
}: SetUserSessionInput): Promise<void> {
  const { cookieStore, token: currentToken } = await readSessionTokenFromCookies();
  const currentTokenHash = currentToken ? hashSessionToken(currentToken) : null;
  const { ipAddress, userAgent } = await getRequestMeta();

  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiryDate();

  const membership = await resolveMembershipForSession(userId, activeMembershipId);

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw<Array<{ locked: number }>>(
      Prisma.sql`select 1::int as locked from pg_advisory_xact_lock(hashtext(${userId}))`,
    );

    await tx.userSession.deleteMany({
      where: {
        userId,
        OR: [
          {
            expiresAt: {
              lte: new Date(),
            },
          },
          ...(currentTokenHash
            ? [
                {
                  tokenHash: currentTokenHash,
                },
              ]
            : []),
        ],
      },
    });

    const activeSessionCount = await tx.userSession.count({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (activeSessionCount >= MAX_ACTIVE_SESSIONS_PER_USER && !replaceExistingSessions) {
      throw new ActiveSessionLimitError();
    }

    if (activeSessionCount >= MAX_ACTIVE_SESSIONS_PER_USER) {
      const sessionsToRemove = await tx.userSession.findMany({
        where: {
          userId,
          expiresAt: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
        },
        orderBy: {
          lastSeenAt: "asc",
        },
        take: activeSessionCount - MAX_ACTIVE_SESSIONS_PER_USER + 1,
      });

      if (sessionsToRemove.length > 0) {
        await tx.userSession.deleteMany({
          where: {
            id: {
              in: sessionsToRemove.map((session) => session.id),
            },
          },
        });
      }
    }

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

  setSessionCookie(cookieStore, token);
}

export const getUserSession = cache(async function getUserSession(): Promise<AppSession | null> {
  const { cookieStore, token, rawValue } = await readSessionTokenFromCookies();

  if (!token) {
    if (rawValue) {
      clearSessionCookie(cookieStore);
    }

    return null;
  }

  try {
    const { session: dbSession, tokenHash } = await findSessionByToken(token);

    if (!dbSession) return null;
    if (dbSession.expiresAt <= new Date()) return null;

    const requestMeta = await getRequestMeta();

    if (!sessionBindingMatches(dbSession, requestMeta)) {
      await invalidateStoredSession({ tokenHash, cookieStore });
      return null;
    }

    const user = await retryTransientDatabaseOperation(
      () =>
        prisma.user.findUnique({
          where: { id: dbSession.userId },
          select: {
            id: true,
            email: true,
            fullName: true,
            platformRole: true,
            mustChangePassword: true,
            termsAcceptedAt: true,
            status: true,
            deletedAt: true,
          },
        }),
      { label: "getUserSession-find-user" },
    );

    if (!user) return null;

    if (user.status !== "ACTIVE" || user.deletedAt !== null) {
      await invalidateStoredSession({ tokenHash, cookieStore });
      return null;
    }

    const now = new Date();
    const headerStore = await headers();
    const pathname = (headerStore.get("x-estatedesk-pathname") ?? "").replace(
      /\/+$/,
      "",
    );
    const isSecurityGateRoute = isSecurityGatePathname(pathname);
    const remainingSeconds = Math.max(
      1,
      Math.floor((dbSession.expiresAt.getTime() - now.getTime()) / 1000),
    );
    const shouldRenewSession =
      !isSecurityGateRoute &&
      remainingSeconds < getSessionMaxAgeSeconds() * SESSION_RENEWAL_THRESHOLD;
    const shouldUpgradeCookie =
      !isSecurityGateRoute && !rawValue?.startsWith("v1.");

    if (!isSecurityGateRoute) {
      if (shouldRenewSession) {
        await retryTransientDatabaseOperation(
          () =>
            prisma.userSession.updateMany({
              where: { tokenHash },
              data: {
                lastSeenAt: now,
                expiresAt: getSessionExpiryDate(),
              },
            }),
          { label: "getUserSession-renew" },
        );
      } else if (dbSession.lastSeenAt < getSessionHeartbeatBefore(now)) {
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

      if (shouldRenewSession || shouldUpgradeCookie) {
        setSessionCookie(
          cookieStore,
          token,
          shouldRenewSession ? getSessionMaxAgeSeconds() : remainingSeconds,
        );
      }
    }

    const activeMembershipId = dbSession.activeMembershipId;
    const activeMembership = activeMembershipId
      ? await retryTransientDatabaseOperation(
          () =>
            prisma.membership.findFirst({
              where: {
                id: activeMembershipId,
                userId: user.id,
                employmentEndedAt: null,
              },
              select: {
                orgId: true,
                role: true,
                scopeType: true,
                scopeId: true,
              },
            }),
          { label: "getUserSession-find-membership" },
        )
      : null;

    return {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      platformRole: user.platformRole,
      mustChangePassword: user.mustChangePassword,
      requiresTermsAcceptance: !user.termsAcceptedAt,
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
  const { cookieStore, token } = await readSessionTokenFromCookies();

  if (token) {
    const tokenHash = hashSessionToken(token);

    await prisma.userSession.deleteMany({
      where: {
        OR: [
          { tokenHash },
          ...(legacyHashOpaqueToken(token) !== tokenHash
            ? [{ tokenHash: legacyHashOpaqueToken(token) }]
            : []),
        ],
      },
    });
  }

  clearSessionCookie(cookieStore);
}

export async function getManagedUserSessions(
  userId: string,
): Promise<ManagedUserSession[]> {
  const currentTokenHash = await getCurrentTokenHash();

  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      tokenHash: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
      ipAddress: true,
      userAgent: true,
    },
    orderBy: [
      {
        lastSeenAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  return sessions.map((session) => ({
    id: session.id,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
    expiresAt: session.expiresAt,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    isCurrent: Boolean(currentTokenHash && session.tokenHash === currentTokenHash),
  }));
}

export async function revokeOtherUserSession({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}): Promise<boolean> {
  const currentTokenHash = await getCurrentTokenHash();

  const result = await prisma.userSession.deleteMany({
    where: {
      id: sessionId,
      userId,
      ...(currentTokenHash
        ? {
            tokenHash: {
              not: currentTokenHash,
            },
          }
        : {}),
    },
  });

  return result.count > 0;
}

export async function revokeOtherUserSessions(userId: string): Promise<number> {
  const currentTokenHash = await getCurrentTokenHash();

  const result = await prisma.userSession.deleteMany({
    where: {
      userId,
      ...(currentTokenHash
        ? {
            tokenHash: {
              not: currentTokenHash,
            },
          }
        : {}),
    },
  });

  return result.count;
}

export async function switchActiveMembership(
  membershipId: string,
): Promise<void> {
  const { cookieStore, token } = await readSessionTokenFromCookies();

  if (!token) {
    redirect("/login");
  }

  const { session: dbSession, tokenHash } = await findSessionByToken(token);

  if (!dbSession) {
    clearSessionCookie(cookieStore);
    redirect("/login");
  }

  const requestMeta = await getRequestMeta();

  if (!sessionBindingMatches(dbSession, requestMeta)) {
    await invalidateStoredSession({ tokenHash, cookieStore });
    redirect("/login");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      userId: dbSession.userId,
      employmentEndedAt: null,
    },
    include: {
      org: {
        select: {
          name: true,
          status: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!membership) {
    throw new Error("Membership not found for this user.");
  }

  if (membership.org.deletedAt || membership.org.status !== "ACTIVE") {
    redirect(
      `/service-terminated?organization=${encodeURIComponent(membership.org.name)}`,
    );
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

  setSessionCookie(cookieStore, token, remainingSeconds);
}

export async function requireUserSession(): Promise<AppSession> {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}