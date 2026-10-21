import "server-only";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAccountSetupUrl } from "@/lib/auth/account-setup";

const propertyIdsSchema = z.array(z.string().min(1).max(100)).max(200).transform(ids => [...new Set(ids)]);
export const landlordAccountSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,30}$/),
  email: z.union([z.literal(""), z.email()]).transform(value => value.toLowerCase() || null),
  phone: z.string().trim().max(30).refine(value => !value || /^\+?[0-9 ()-]{7,30}$/.test(value), "Enter a valid phone number.").transform(value => value.replace(/[ ()-]/g, "") || null),
  propertyIds: propertyIdsSchema.refine(ids => ids.length > 0, "Choose at least one property."),
});

async function lockOrganization(tx: Prisma.TransactionClient, orgId: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Organization" WHERE "id" = ${orgId} AND "status" = 'ACTIVE' AND "deletedAt" IS NULL FOR UPDATE`;
  if (!rows.length) throw new Error("Organization is unavailable.");
}
async function validateProperties(tx: Prisma.TransactionClient, orgId: string, ids: string[]) {
  const count = await tx.property.count({ where: { id: { in: ids }, orgId, deletedAt: null, isActive: true } });
  if (count !== ids.length) throw new Error("Choose active properties belonging to this organization.");
}
async function replacePropertyAssignments(tx: Prisma.TransactionClient, orgId: string, landlordProfileId: string, ids: string[], actorUserId: string) {
  // Preserve unit-specific assignments and retain the history of removed properties.
  const existing = await tx.landlordAssignment.findMany({ where: { orgId, landlordProfileId, propertyId: { not: null }, unitId: null, active: true, endedAt: null }, select: { id: true, propertyId: true } });
  await tx.landlordAssignment.updateMany({ where: { id: { in: existing.filter(row => !ids.includes(row.propertyId!)).map(row => row.id) } }, data: { active: false, endedAt: new Date() } });
  const alreadyMapped = new Set(existing.map(row => row.propertyId));
  const additions = ids.filter(id => !alreadyMapped.has(id));
  if (additions.length) await tx.landlordAssignment.createMany({ data: additions.map(propertyId => ({ orgId, landlordProfileId, propertyId, unitId: null, active: true })) });
  await tx.auditLog.create({ data: { orgId, actorUserId, action: "LANDLORD_PROPERTIES_UPDATED", entityType: "LandlordProfile", entityId: landlordProfileId, metadata: { previousPropertyIds: existing.map(row => row.propertyId), propertyIds: ids } } });
}

export async function createLandlordAccount(orgId: string, actorUserId: string, rawInput: unknown) {
  const input = landlordAccountSchema.parse(rawInput);
  // The recipient sets their own password through the one-hour setup link.
  const passwordHash = await hash(randomBytes(32).toString("hex"), 12);
  return prisma.$transaction(async tx => {
    await lockOrganization(tx, orgId);
    await validateProperties(tx, orgId, input.propertyIds);
    const user = await tx.user.create({ data: { fullName: input.fullName, username: input.username, email: input.email, phone: input.phone, passwordHash, mustChangePassword: true, createdByUserId: actorUserId } });
    await tx.membership.create({ data: { orgId, userId: user.id, role: "LANDLORD", scopeType: "ORG", scopeId: "ORG_SCOPE" } });
    const profile = await tx.landlordProfile.create({ data: { orgId, userId: user.id, displayName: input.fullName, email: input.email, phone: input.phone } });
    await replacePropertyAssignments(tx, orgId, profile.id, input.propertyIds, actorUserId);
    const setupUrl = await createAccountSetupUrl(tx, user.id, input.email);
    await tx.auditLog.create({ data: { orgId, actorUserId, action: "LANDLORD_ACCOUNT_CREATED", entityType: "LandlordProfile", entityId: profile.id, metadata: { userId: user.id, propertyIds: input.propertyIds } } });
    return { profileId: profile.id, fullName: input.fullName, username: input.username, email: input.email, phone: input.phone, setupUrl };
  });
}

export async function mapLandlordProperties(orgId: string, actorUserId: string, profileId: string, propertyIds: unknown) {
  const ids = propertyIdsSchema.parse(propertyIds);
  await prisma.$transaction(async tx => {
    await lockOrganization(tx, orgId);
    const profile = await tx.landlordProfile.findFirst({ where: { id: profileId, orgId, deletedAt: null, isActive: true, user: { deletedAt: null, status: "ACTIVE" } }, select: { id: true } });
    if (!profile) throw new Error("Landlord account was not found in this organization.");
    await validateProperties(tx, orgId, ids);
    await replacePropertyAssignments(tx, orgId, profile.id, ids, actorUserId);
  });
}

/** Reissue links only within the administrator's authority over the underlying identity. */
export async function reissueLandlordSetup(orgId: string, actorUserId: string, profileId: string, platformOperator = false) {
  return prisma.$transaction(async tx => {
    await lockOrganization(tx, orgId);
    const profile = await tx.landlordProfile.findFirst({
      where: { id: profileId, orgId, deletedAt: null, isActive: true, user: { status: "ACTIVE", deletedAt: null } },
      include: { user: { include: { memberships: { select: { orgId: true, role: true } }, landlordProfiles: { select: { orgId: true } }, serviceProvider: { select: { id: true } } } } },
    });
    if (!profile) throw new Error("Active landlord account not found.");
    const user = profile.user;
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
    if (user.platformRole !== "USER" || (!platformOperator && (user.serviceProvider || user.memberships.some(row => row.orgId !== orgId || row.role !== "LANDLORD") || user.landlordProfiles.some(row => row.orgId !== orgId)))) {
      throw new Error("Shared or privileged identities require the platform account recovery workflow.");
    }
    await tx.passwordResetToken.deleteMany({ where: { OR: [{ userId: user.id }, ...(user.email ? [{ email: user.email }] : [])] } });
    const setupUrl = await createAccountSetupUrl(tx, user.id, user.email);
    await tx.auditLog.create({ data: { orgId, actorUserId, action: "LANDLORD_SETUP_LINK_REISSUED", entityType: "LandlordProfile", entityId: profile.id, metadata: { userId: user.id } } });
    return { fullName: user.fullName, username: user.username ?? user.email ?? "", email: user.email, phone: user.phone, setupUrl };
  });
}

/** Suspend this organization's landlord memberships without changing other roles or organizations. */
export async function setLandlordAccess(orgId: string, actorUserId: string, profileId: string, active: boolean, reason: string) {
  const notes = z.string().trim().min(5).max(500).parse(reason);
  await prisma.$transaction(async tx => {
    await lockOrganization(tx, orgId);
    const profile = await tx.landlordProfile.findFirst({ where: { id: profileId, orgId, deletedAt: null }, select: { id: true, userId: true, isActive: true } });
    if (!profile) throw new Error("Landlord account not found.");
    if (profile.isActive === active) return;
    const marker = `landlord-profile:${profile.id}:suspended`;
    if (!active) {
      await tx.membership.updateMany({ where: { orgId, userId: profile.userId, role: "LANDLORD", employmentEndedAt: null, deactivatedAt: null }, data: { deactivatedAt: new Date(), deactivatedByUserId: actorUserId, deactivationNotes: marker } });
      await tx.userSession.deleteMany({ where: { userId: profile.userId, activeMembership: { orgId, role: "LANDLORD" } } });
      // A suspended account must not retain an outstanding recovery capability issued here.
      const sharedMemberships = await tx.membership.count({ where: { userId: profile.userId, OR: [{ orgId: { not: orgId } }, { role: { not: "LANDLORD" } }] } });
      if (!sharedMemberships) await tx.passwordResetToken.deleteMany({ where: { userId: profile.userId } });
    } else {
      // Never reactivate memberships independently disabled by another workflow.
      await tx.membership.updateMany({ where: { orgId, userId: profile.userId, role: "LANDLORD", employmentEndedAt: null, deactivationNotes: marker }, data: { deactivatedAt: null, deactivatedByUserId: null, deactivationNotes: null } });
    }
    await tx.landlordProfile.update({ where: { id: profile.id }, data: { isActive: active } });
    await tx.auditLog.create({ data: { orgId, actorUserId, action: active ? "LANDLORD_ACCESS_REACTIVATED" : "LANDLORD_ACCESS_SUSPENDED", entityType: "LandlordProfile", entityId: profile.id, metadata: { userId: profile.userId, reason: notes } } });
  });
}
