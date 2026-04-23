import "server-only";

import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import type {
  OrgRole,
  PlatformRole,
  ScopeType,
} from "@prisma/client";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type { OrgRole, PlatformRole, ScopeType };

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

type SetUserSessionInput = {
  userId: string;
  activeMembershipId?: string | null;
};

const SESSION_COOKIE_NAME = "estatedesk_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const ENFORCE_USER_AGENT_MATCH = false;
const ENFORCE_IP_MATCH = false;

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getSessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
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
) {
  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    getCookieOptions({ maxAge: SESSION_MAX_AGE_SECONDS }),
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
  activeMembershipId = null,
}: SetUserSessionInput): Promise<void> {
  const cookieStore = await cookies();
  const { ipAddress, userAgent } = await getRequestMeta();

  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = getSessionExpiryDate();

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

  setSessionCookie(cookieStore, token);
}

export async function getUserSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  try {
    const dbSession = await prisma.userSession.findUnique({
      where: { tokenHash },
      include: {
        user: true,
        activeMembership: true,
      },
    });

    if (!dbSession) return null;
    if (dbSession.expiresAt <= new Date()) return null;

    const user = dbSession.user;

    if (user.status !== "ACTIVE" || user.deletedAt !== null) {
      return null;
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
}

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

  await prisma.userSession.update({
    where: { tokenHash },
    data: {
      activeMembershipId: membership.id,
      lastSeenAt: new Date(),
      expiresAt: getSessionExpiryDate(),
    },
  });

  setSessionCookie(cookieStore, token);
}

export async function requireUserSession(): Promise<AppSession> {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}