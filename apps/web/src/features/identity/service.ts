import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nationalIdSchema } from "./policy";
export async function identityOwners(number: string, db: Prisma.TransactionClient = prisma) {
  const normalized = nationalIdSchema.parse(number);
  // Uses the same normalisation as the database triggers, including older rows.
  const rows = await db.$queryRaw<{ ownerKey: string; userId: string | null }[]>(Prisma.sql`
    SELECT DISTINCT "ownerKey", "userId" FROM (
      SELECT "ownerKey", "userId" FROM "RegisteredIdentityOwners" WHERE number = ${normalized}
      UNION ALL SELECT "ownerKey", "userId" FROM "IdentityClaim" WHERE number = ${normalized}
    ) owners`);
  return rows;
}
export async function linkVerifiedIdentity(orgId: string, requestId: string, actorUserId: string) {
  return prisma.$transaction(async tx => {
    const changed = await tx.identityVerificationRequest.updateMany({ where: { id: requestId, orgId, status: "APPROVED", verifiedUserId: { not: null } }, data: { status: "USED" } });
    if (!changed.count) throw new Error("Platform approval is required, or this request has already been used.");
    const request = await tx.identityVerificationRequest.findUniqueOrThrow({ where: { id: requestId } });
    const user = await tx.user.findFirst({ where: { id: request.verifiedUserId!, status: "ACTIVE", deletedAt: null } });
    if (!user) throw new Error("The verified account is no longer active.");
    const owners = await identityOwners(request.number, tx);
    if (owners.length !== 1 || owners[0].userId !== user.id) throw new Error("The registered ID ownership has changed. Request a new platform review.");
    const membership = await tx.membership.upsert({ where: { orgId_userId_role_scopeType_scopeId: { orgId, userId: user.id, role: request.requestedRole, scopeType: "ORG", scopeId: "ORG_SCOPE" } }, create: { orgId, userId: user.id, role: request.requestedRole, scopeType: "ORG", scopeId: "ORG_SCOPE" }, update: {} });
    if (membership.deactivatedAt || membership.employmentEndedAt) throw new Error("This existing membership is inactive. Restore it through the normal staff controls.");
    if (request.requestedRole === "TENANT") {
      const { allocateTenantSlug } = await import("@/lib/tenants/slug");
      const existing = await tx.tenant.findFirst({ where: { orgId, userId: user.id } });
      if (existing?.deletedAt) throw new Error("An archived tenant profile already exists here. Restore it before linking.");
      if (!existing) {
        const source = await tx.tenant.findFirst({ where: { userId: user.id, nationalId: request.number }, select: { identityId: true } });
        await tx.tenant.create({ data: { orgId, userId: user.id, fullName: user.fullName, phone: user.phone ?? request.phone, email: user.email, nationalId: request.number, identityId: source?.identityId, slug: await allocateTenantSlug(tx, orgId, user.fullName) } });
      }
    } else if (request.requestedRole === "LANDLORD") {
      await tx.landlordProfile.upsert({ where: { orgId_userId: { orgId, userId: user.id } }, create: { orgId, userId: user.id, displayName: user.fullName, phone: user.phone, email: user.email, nationalId: request.number }, update: {} });
    } else {
      await tx.staffProfile.upsert({ where: { membershipId: membership.id }, create: { membershipId: membership.id, nationalId: request.number }, update: {} });
    }
    await tx.auditLog.create({ data: { orgId, actorUserId, action: "VERIFIED_ID_ACCOUNT_LINKED", entityType: "IdentityVerificationRequest", entityId: requestId, metadata: { userId: user.id, role: request.requestedRole } } });
  });
}
