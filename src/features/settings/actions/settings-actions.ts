"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId, requireOrgAccess } from "@/lib/auth/org";
import { requireUserSession } from "@/lib/auth/session";

const SETTINGS_PATH = "/dashboard/org/settings";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(formData: FormData, key: string) {
  const value = readString(formData, key);
  return value ? value : null;
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function asObject(
  value: Prisma.JsonValue | null | undefined,
): Record<string, Prisma.JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Prisma.JsonValue>;
}

async function ensureSettingsWriteAccess() {
  const orgId = await requireCurrentOrgId();
  const membership = await requireOrgAccess(orgId);

  if (!["ADMIN", "MANAGER"].includes(membership.role)) {
    throw new Error("Forbidden");
  }

  return { orgId, membership };
}

export async function updateOrganizationAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();

  const name = readString(formData, "organizationName");
  const slug = readString(formData, "slug");
  const email = readOptionalString(formData, "email");
  const phone = readOptionalString(formData, "phone");
  const address = readOptionalString(formData, "address");
  const timezone = readString(formData, "timezone");
  const currency = readString(formData, "currency").toUpperCase();

  if (!name || !slug || !timezone || !currency) {
    throw new Error("Name, slug, timezone, and currency are required.");
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      name,
      slug,
      email,
      phone,
      address,
      timezone,
      currencyCode: currency,
    },
  });

  revalidatePath(SETTINGS_PATH);
}

export async function updatePreferencesAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();

  const existing = await prisma.organizationSettings.findUnique({
    where: { orgId },
    select: {
      features: true,
      notificationDefaults: true,
    },
  });

  const nextFeatures = {
    ...asObject(existing?.features),
    tenantPortal: readBoolean(formData, "tenantPortal"),
    issueTracking: readBoolean(formData, "issueTracking"),
    waterBilling: readBoolean(formData, "waterBilling"),
    taxTracking: readBoolean(formData, "taxTracking"),
  };

  const nextNotificationDefaults = {
    ...asObject(existing?.notificationDefaults),
    smsNotifications: readBoolean(formData, "smsNotifications"),
    emailNotifications: readBoolean(formData, "emailNotifications"),
  };

  await prisma.organizationSettings.upsert({
    where: { orgId },
    update: {
      features: nextFeatures,
      notificationDefaults: nextNotificationDefaults,
    },
    create: {
      orgId,
      features: nextFeatures,
      notificationDefaults: nextNotificationDefaults,
    },
  });

  revalidatePath(SETTINGS_PATH);
}

export async function updateBillingAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();

  const billingEmail = readOptionalString(formData, "billingEmail");
  const plan = readString(formData, "subscriptionPlan") as
    | "FREE"
    | "PRO"
    | "PLUS"
    | "ENTERPRISE";

  if (!["FREE", "PRO", "PLUS", "ENTERPRISE"].includes(plan)) {
    throw new Error("Invalid subscription plan.");
  }

  const existing = await prisma.subscription.findUnique({
    where: { orgId },
    select: {
      currentPeriodStart: true,
      currentPeriodEnd: true,
    },
  });

  const now = new Date();

  await prisma.subscription.upsert({
    where: { orgId },
    update: {
      billingEmail,
      plan,
    },
    create: {
      orgId,
      plan,
      status: "ACTIVE",
      billingEmail,
      currentPeriodStart: existing?.currentPeriodStart ?? now,
      currentPeriodEnd: existing?.currentPeriodEnd ?? addMonths(now, 1),
    },
  });

  revalidatePath(SETTINGS_PATH);
}

export async function inviteMemberAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();
  const session = await requireUserSession();

  const email = readString(formData, "email").toLowerCase();
  const role = readString(formData, "role") as
    | "ADMIN"
    | "MANAGER"
    | "OFFICE"
    | "ACCOUNTANT"
    | "CARETAKER"
    | "TENANT";

  if (!email) {
    throw new Error("Email is required.");
  }

  if (
    !["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER", "TENANT"].includes(
      role,
    )
  ) {
    throw new Error("Invalid role.");
  }

  const existingInvite = await prisma.invitation.findFirst({
    where: {
      orgId,
      email,
      status: "PENDING",
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
    },
  });

  if (existingInvite) {
    throw new Error("A pending invitation already exists for this email.");
  }

  const token = randomBytes(24).toString("hex");

  await prisma.invitation.create({
    data: {
      orgId,
      email,
      role,
      token,
      expiresAt: addDays(new Date(), 7),
      invitedById: session.userId,
    },
  });

  revalidatePath(SETTINGS_PATH);
}

export async function createApiKeyAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();
  const session = await requireUserSession();

  const name = readString(formData, "name");
  const expiresAtRaw = readString(formData, "expiresAt");

  if (!name) {
    throw new Error("API key name is required.");
  }

  const plainKey = `edk_${randomBytes(32).toString("hex")}`;
  const keyHash = createHash("sha256").update(plainKey).digest("hex");

  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

  if (expiresAtRaw && Number.isNaN(expiresAt?.getTime())) {
    throw new Error("Invalid expiry date.");
  }

  await prisma.apiKey.create({
    data: {
      orgId,
      name,
      keyHash,
      expiresAt,
      createdById: session.userId,
      isActive: true,
    },
  });

  revalidatePath(SETTINGS_PATH);

  // Plain key is intentionally not returned here because this page is using
  // direct server-action form posts without client action state.
}

export async function toggleApiKeyStatusAction(formData: FormData) {
  const { orgId } = await ensureSettingsWriteAccess();

  const apiKeyId = readString(formData, "apiKeyId");
  const nextActive = readString(formData, "nextActive") === "true";

  if (!apiKeyId) {
    throw new Error("API key id is required.");
  }

  await prisma.apiKey.updateMany({
    where: {
      id: apiKeyId,
      orgId,
    },
    data: {
      isActive: nextActive,
    },
  });

  revalidatePath(SETTINGS_PATH);
}