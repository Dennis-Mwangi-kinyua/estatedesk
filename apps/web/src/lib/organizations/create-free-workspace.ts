import "server-only";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { hashOpaqueToken } from "@/lib/crypto/tokens";
import { prisma } from "@/lib/prisma";
import { resolveMarketerReferral } from "@/lib/marketing/referrals";

const TERMS_VERSION = "2026-06-02";

export type FreeWorkspaceInput = {
  accountType: "PROPERTY_MANAGER" | "LANDLORD";
  fullName: string;
  companyName: string;
  workEmail: string;
  phone?: string;
  managedPropertyType: string;
  passwordHash: string;
  referralCode?: string;
  message?: string;
  ipAddress?: string;
  userAgent?: string | null;
};

export type FreeWorkspaceResult = {
  userId: string;
  membershipId: string;
  orgId: string;
  slug: string;
  email: string;
  verificationToken: string;
};

export function workspaceSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 48);
}

export function normalizeWorkspacePhone(value: string) {
  return value.replace(/[\s().-]/g, "");
}

export function isWorkspacePhone(value: string) {
  return !value.trim() || /^\+[1-9]\d{7,14}$/.test(normalizeWorkspacePhone(value));
}

export async function hashWorkspacePassword(password: string) {
  return bcrypt.hash(password, 12);
}

function addAnnualPeriodEnd(start: Date) {
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + 1);
  return end;
}

async function availableSlug(tx: Prisma.TransactionClient, base: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`.slice(0, 60);
    const existing = await tx.organization.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }
  return null;
}

export async function createFreeWorkspace(input: FreeWorkspaceInput): Promise<FreeWorkspaceResult> {
  const email = input.workEmail.toLowerCase();
  const phone = input.phone ? normalizeWorkspacePhone(input.phone) : "";
  const slugBase = workspaceSlug(input.companyName);
  if (!slugBase) throw new Error("WORKSPACE_SLUG");

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const [nameTaken, existingUser] = await Promise.all([
      tx.organization.findFirst({ where: { name: input.companyName, deletedAt: null }, select: { id: true } }),
      tx.user.findFirst({
        where: { OR: [{ email }, { username: email }, ...(phone ? [{ phone }] : [])] },
        select: { id: true, email: true, username: true, phone: true },
      }),
    ]);
    if (nameTaken) throw new Error("WORKSPACE_NAME");
    if (existingUser?.email === email || existingUser?.username === email) throw new Error("WORKSPACE_EMAIL");
    if (phone && existingUser?.phone === phone) throw new Error("WORKSPACE_PHONE");

    const slug = await availableSlug(tx, slugBase);
    if (!slug) throw new Error("WORKSPACE_SLUG");
    const attribution = await resolveMarketerReferral(tx, input.referralCode ?? "");

    const org = await tx.organization.create({
      data: {
        name: input.companyName,
        slug,
        email,
        phone: phone || null,
        status: "ACTIVE",
        currencyCode: "KES",
        timezone: "Africa/Nairobi",
        dataRetentionDays: 2555,
        marketerId: attribution.marketerId,
        referralCode: attribution.referralCode,
        commissionRate: attribution.commissionRate,
      },
    });
    const user = await tx.user.create({
      data: {
        fullName: input.fullName,
        username: email,
        email,
        phone: phone || null,
        passwordHash: input.passwordHash,
        status: "ACTIVE",
        platformRole: "USER",
        mustChangePassword: false,
        passwordChangedAt: now,
        termsAcceptedAt: now,
        termsAcceptedVersion: TERMS_VERSION,
      },
    });
    const membership = await tx.membership.create({
      data: { orgId: org.id, userId: user.id, role: "ADMIN", scopeType: "ORG", scopeId: "ORG_SCOPE" },
    });
    if (input.accountType === "LANDLORD") {
      await tx.landlordProfile.create({
        data: {
          orgId: org.id,
          userId: user.id,
          displayName: input.fullName,
          email,
          phone: phone || null,
          notes: "Created when the landlord started a Free workspace.",
        },
      });
    }
    await tx.organizationSettings.create({
      data: { orgId: org.id, branding: {}, features: {}, customFields: {}, notificationDefaults: {} },
    });
    await tx.subscription.create({
      data: {
        orgId: org.id,
        plan: "FREE",
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: addAnnualPeriodEnd(now),
        billingEmail: email,
        metadata: { accountType: input.accountType, amountDue: 0, source: "SELF_SERVE_FREE" },
      },
    });
    await tx.onboardingRequest.create({
      data: {
        fullName: input.fullName,
        companyName: input.companyName,
        workEmail: email,
        phone: phone || null,
        managedPropertyType: input.managedPropertyType,
        message: `Account type: ${input.accountType === "LANDLORD" ? "Landlord" : "Property management agency"}\nPlan: Free\nSelf-serve workspace created.\n${input.message ?? ""}`.trim(),
        status: "WON",
        handledAt: now,
        internalNotes: "Self-serve Free workspace created during registration.",
        source: "SELF_SERVE_FREE",
        marketerId: attribution.marketerId,
        referralCode: attribution.referralCode,
        commissionRate: attribution.commissionRate,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
    await tx.emailVerificationToken.create({
      data: { email, token: hashOpaqueToken(verificationToken, "email-verification"), expiresAt: new Date(now.getTime() + 86_400_000) },
    });
    await tx.auditLog.create({
      data: {
        orgId: org.id,
        actorUserId: user.id,
        action: "ORGANIZATION_CREATED",
        entityType: "Organization",
        entityId: org.id,
        ip: input.ipAddress,
        userAgent: input.userAgent,
        metadata: { plan: "FREE", accountType: input.accountType, source: "SELF_SERVE_FREE" },
      },
    });

    return { userId: user.id, membershipId: membership.id, orgId: org.id, slug, email, verificationToken };
  });
}
