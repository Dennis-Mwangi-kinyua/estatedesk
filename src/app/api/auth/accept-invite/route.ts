import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import type { OrgRole, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { setUserSession } from "@/lib/auth/session";
import { getRedirectAfterLogin } from "@/lib/auth/redirect-after-login";
import { sendAccountCredentials } from "@/lib/notifications/account-credentials";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
import { writeAuditLog } from "@/lib/audit/security";
import { hashOpaqueToken } from "@/lib/crypto/tokens";

type AcceptInviteBody = {
  token?: unknown;
};

type AcceptInviteResult = {
  user: {
    id: string;
    email: string | null;
    fullName: string;
    platformRole: PlatformRole;
    mustChangePassword: boolean;
  };
  membership: { id: string };
  createdUser: boolean;
};

function readToken(body: AcceptInviteBody) {
  return typeof body.token === "string" ? body.token.trim() : "";
}

function displayNameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "Invited user";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ") || "Invited user";
}

function makeTemporaryPassword() {
  return `Ed-${randomBytes(9).toString("base64url")}9!`;
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AcceptInviteBody;
  const token = readToken(body);

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Invalid invitation token." },
      { status: 400 },
    );
  }

  const tokenHash = hashOpaqueToken(token, "invitation");

  const invitation = await retryTransientDatabaseOperation(
    () =>
      prisma.invitation.findFirst({
        where: {
          OR: [
            { token: tokenHash },
            { token },
          ],
        },
        include: {
          org: { select: { id: true, name: true, status: true, deletedAt: true } },
        },
      }),
    { label: "accept-invite-load-invitation", attempts: 3 },
  );

  if (!invitation) {
    return NextResponse.json(
      { success: false, error: "Invitation not found." },
      { status: 404 },
    );
  }

  if (invitation.status !== "PENDING") {
    return NextResponse.json(
      {
        success: false,
        error: "This invitation has already been used or cancelled.",
      },
      { status: 409 },
    );
  }

  if (invitation.expiresAt <= new Date()) {
    return NextResponse.json(
      { success: false, error: "This invitation has expired." },
      { status: 410 },
    );
  }

  if (invitation.org.deletedAt || invitation.org.status !== "ACTIVE") {
    return NextResponse.json(
      { success: false, error: "This organization is not active." },
      { status: 403 },
    );
  }

  const temporaryPassword = makeTemporaryPassword();
  const passwordHash = await hash(temporaryPassword, 12);

  let result: AcceptInviteResult;

  try {
    result = await retryTransientDatabaseOperation(
      () =>
        prisma.$transaction(async (tx) => {
          let user = await tx.user.findFirst({
            where: {
              email: invitation.email,
              deletedAt: null,
            },
            select: {
              id: true,
              email: true,
              fullName: true,
              platformRole: true,
              mustChangePassword: true,
            },
          });

        const createdUser = !user;

        if (!user) {
          user = await tx.user.create({
            data: {
              fullName: displayNameFromEmail(invitation.email),
              email: invitation.email,
              passwordHash,
              status: "ACTIVE",
              platformRole: "USER",
              mustChangePassword: true,
              emailVerified: new Date(),
            },
            select: {
              id: true,
              email: true,
              fullName: true,
              platformRole: true,
              mustChangePassword: true,
            },
          });
        }

        const existingMembership = await tx.membership.findFirst({
          where: {
            orgId: invitation.orgId,
            userId: user.id,
            role: invitation.role,
            scopeType: invitation.scopeType,
            scopeId: invitation.scopeId,
          },
          select: { id: true },
        });

        const membership =
          existingMembership ??
          (await tx.membership.create({
            data: {
              orgId: invitation.orgId,
              userId: user.id,
              role: invitation.role as OrgRole,
              scopeType: invitation.scopeType,
              scopeId: invitation.scopeId,
            },
            select: { id: true },
          }));

        const acceptedInvite = await tx.invitation.updateMany({
          where: {
            id: invitation.id,
            status: "PENDING",
          },
          data: {
            status: "ACCEPTED",
            deliveryMeta: {
              ...(isJsonRecord(invitation.deliveryMeta)
                ? invitation.deliveryMeta
                : {}),
              acceptedAt: new Date().toISOString(),
              acceptedByUserId: user.id,
            },
          },
        });

        if (acceptedInvite.count !== 1) {
          throw new Error("INVITATION_ALREADY_CLAIMED");
        }

          return {
            user,
            membership,
            createdUser,
          };
        }),
      { label: "accept-invite-transaction", attempts: 1 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "INVITATION_ALREADY_CLAIMED") {
      return NextResponse.json(
        {
          success: false,
          error: "This invitation has already been used or cancelled.",
        },
        { status: 409 },
      );
    }

    throw error;
  }

  await setUserSession({
    userId: result.user.id,
    activeMembershipId: result.membership.id,
    replaceExistingSessions: true,
  });

  if (result.createdUser) {
    await sendAccountCredentials({
      fullName: result.user.fullName,
      username: result.user.email ?? invitation.email,
      password: temporaryPassword,
      email: result.user.email ?? invitation.email,
      role: invitation.role,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/login`,
    });
  }

  await writeAuditLog({
    orgId: invitation.orgId,
    actorUserId: result.user.id,
    action: "INVITATION_ACCEPTED",
    entityType: "Invitation",
    entityId: invitation.id,
    metadata: {
      role: invitation.role,
      email: invitation.email,
      createdUser: result.createdUser,
    },
  });

  const redirectTo = result.user.mustChangePassword
    ? "/change-password"
    : getRedirectAfterLogin({
        platformRole: result.user.platformRole,
        activeOrgRole: invitation.role,
        activeOrgId: invitation.orgId,
        hasTenantProfile: invitation.role === "TENANT",
      });

  return NextResponse.json({
    success: true,
    message: "Invitation accepted successfully.",
    redirectTo,
    organizationId: invitation.orgId,
  });
}
