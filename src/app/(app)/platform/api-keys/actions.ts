"use server";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit/security";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { sendSecurityAlert } from "@/lib/security/alerts";

const UNLOCK_COOKIE = "estatedesk_platform_api_keys_unlocked";
const PAGE_PATH = "/platform/api-keys";

export type CreateVacantHousesApiKeyState = {
  success: boolean;
  error?: string;
  plainKey?: string;
};

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getPagePassword() {
  return process.env.PLATFORM_API_KEYS_PAGE_PASSWORD ?? "";
}

function getCookieToken() {
  const password = getPagePassword();
  const secret = process.env.AUTH_SECRET ?? process.env.DATABASE_URL ?? "estatedesk";
  return createHash("sha256").update(`${password}:${secret}`).digest("hex");
}

function safeEquals(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function isPlatformApiKeysUnlocked() {
  const password = getPagePassword();

  if (!password) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(UNLOCK_COOKIE)?.value ?? "";
  return safeEquals(token, getCookieToken());
}

export async function unlockPlatformApiKeysPageAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const configuredPassword = getPagePassword();

  if (!configuredPassword) {
    redirect(`${PAGE_PATH}?error=missing-password`);
  }

  const password = readString(formData, "password");

  if (!safeEquals(password, configuredPassword)) {
    await sendSecurityAlert({
      event: "PLATFORM_API_KEYS_UNLOCK_FAILED",
      severity: "warning",
      actorUserId: session.userId,
      summary: "A platform user entered an invalid API key vault password.",
    });

    redirect(`${PAGE_PATH}?error=invalid-password`);
  }

  const cookieStore = await cookies();
  cookieStore.set(UNLOCK_COOKIE, getCookieToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: PAGE_PATH,
    maxAge: 60 * 30,
  });

  redirect(PAGE_PATH);
}

async function requireUnlockedPlatformApiKeys() {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  if (!(await isPlatformApiKeysUnlocked())) {
    throw new Error("API key management page is locked.");
  }
}

export async function createVacantHousesApiKeyAction(
  _prevState: CreateVacantHousesApiKeyState,
  formData: FormData,
): Promise<CreateVacantHousesApiKeyState> {
  await requireUnlockedPlatformApiKeys();

  const orgId = readString(formData, "orgId");
  const name = readString(formData, "name");
  const expiresAtRaw = readString(formData, "expiresAt");
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  if (!orgId) {
    return { success: false, error: "Organization is required." };
  }

  if (!name) {
    return { success: false, error: "Key name is required." };
  }

  const organization = await prisma.organization.findFirst({
    where: {
      id: orgId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!organization) {
    return { success: false, error: "Organization not found." };
  }

  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

  if (expiresAtRaw && Number.isNaN(expiresAt?.getTime())) {
    return { success: false, error: "Invalid expiry date." };
  }

  const plainKey = `edk_vacant_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(plainKey).digest("hex");

  const apiKey = await prisma.apiKey.create({
    data: {
      orgId,
      name,
      keyHash,
      expiresAt,
      createdById: session.userId,
      isActive: true,
      permissions: {
        publicListings: ["vacant_units:read"],
      },
    },
    select: {
      id: true,
    },
  });

  await writeAuditLog({
    orgId,
    actorUserId: session.userId,
    action: "PUBLIC_API_KEY_CREATED",
    entityType: "ApiKey",
    entityId: apiKey.id,
    metadata: {
      name,
      expiresAt: expiresAt?.toISOString() ?? null,
      permissions: ["vacant_units:read"],
    },
  });

  await sendSecurityAlert({
    event: "PUBLIC_API_KEY_CREATED",
    severity: "critical",
    actorUserId: session.userId,
    orgId,
    entityType: "ApiKey",
    entityId: apiKey.id,
    summary: `${session.fullName} created a public vacant houses API key.`,
    metadata: {
      name,
      expiresAt: expiresAt?.toISOString() ?? null,
      permissions: ["vacant_units:read"],
    },
  });

  revalidatePath(PAGE_PATH);

  return {
    success: true,
    plainKey,
  };
}

export async function togglePlatformApiKeyStatusAction(formData: FormData) {
  await requireUnlockedPlatformApiKeys();

  const apiKeyId = readString(formData, "apiKeyId");
  const nextActive = readString(formData, "nextActive") === "true";

  if (!apiKeyId) {
    throw new Error("API key id is required.");
  }

  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const existing = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    select: { id: true, orgId: true, name: true, isActive: true },
  });

  if (!existing) {
    throw new Error("API key not found.");
  }

  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { isActive: nextActive },
  });

  await writeAuditLog({
    orgId: existing.orgId,
    actorUserId: session.userId,
    action: "PUBLIC_API_KEY_STATUS_UPDATED",
    entityType: "ApiKey",
    entityId: apiKeyId,
    beforeState: { isActive: existing.isActive },
    afterState: { isActive: nextActive },
    metadata: { name: existing.name },
  });

  await sendSecurityAlert({
    event: "PUBLIC_API_KEY_STATUS_UPDATED",
    severity: nextActive ? "critical" : "warning",
    actorUserId: session.userId,
    orgId: existing.orgId,
    entityType: "ApiKey",
    entityId: apiKeyId,
    summary: `${session.fullName} ${nextActive ? "activated" : "deactivated"} a public API key.`,
    metadata: { name: existing.name },
  });

  revalidatePath(PAGE_PATH);
}

export async function deletePlatformApiKeyAction(formData: FormData) {
  await requireUnlockedPlatformApiKeys();

  const apiKeyId = readString(formData, "apiKeyId");

  if (!apiKeyId) {
    throw new Error("API key id is required.");
  }

  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const existing = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
    select: { id: true, orgId: true, name: true, permissions: true },
  });

  if (!existing) {
    throw new Error("API key not found.");
  }

  await prisma.apiKey.delete({ where: { id: apiKeyId } });

  await writeAuditLog({
    orgId: existing.orgId,
    actorUserId: session.userId,
    action: "PUBLIC_API_KEY_DELETED",
    entityType: "ApiKey",
    entityId: apiKeyId,
    beforeState: {
      name: existing.name,
      permissions: existing.permissions,
    },
  });

  await sendSecurityAlert({
    event: "PUBLIC_API_KEY_DELETED",
    severity: "critical",
    actorUserId: session.userId,
    orgId: existing.orgId,
    entityType: "ApiKey",
    entityId: apiKeyId,
    summary: `${session.fullName} deleted a public API key.`,
    metadata: {
      name: existing.name,
    },
  });

  revalidatePath(PAGE_PATH);
}
