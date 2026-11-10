import "server-only";
import { prisma } from "@/lib/prisma";
import { associatedOrganizationUsers, blacklistedOrganizationUsers, OrganizationBlacklistedError } from "./blacklist-policy";

export async function assertUserNotBlacklisted(userId: string) {
  if (await prisma.user.findFirst({ where: { id: userId, ...blacklistedOrganizationUsers() }, select: { id: true } })) {
    throw new OrganizationBlacklistedError();
  }
}

/** Caller must authorize a platform administrator and validate the confirmation. */
export async function changeOrganizationBlacklist(input: { orgId: string; actorUserId: string; locked: boolean; reason: string }) {
  return prisma.$transaction(async tx => {
    const org = await tx.organization.findUnique({ where: { id: input.orgId }, select: { id: true, blacklistedAt: true, status: true, deletedAt: true } });
    if (!org || org.deletedAt) throw new Error("Organization is unavailable.");
    // Preserve status on unlock: reactivation is a separate explicit operation.
    const changed = await tx.organization.updateMany({
      where: { id: org.id, deletedAt: null, blacklistedAt: org.blacklistedAt },
      data: { blacklistedAt: input.locked ? org.blacklistedAt ?? new Date() : null, blacklistReason: input.locked ? input.reason : null, ...(input.locked ? { status: "DISABLED" as const } : {}) },
    });
    if (changed.count !== 1) throw new Error("Organization changed. Refresh and try again.");
    if (input.locked) {
      const affected = associatedOrganizationUsers({ id: org.id });
      await tx.userSession.deleteMany({ where: { user: affected } });
      await tx.pushSubscription.deleteMany({ where: { user: affected } });
      await tx.apiKey.updateMany({ where: { OR: [{ orgId: org.id }, { createdBy: affected }] }, data: { isActive: false } });
    }
    await tx.auditLog.create({ data: { orgId: org.id, actorUserId: input.actorUserId,
      action: input.locked ? "ORGANIZATION_BLACKLISTED" : "ORGANIZATION_UNBLACKLISTED", entityType: "Organization", entityId: org.id,
      metadata: { reason: input.reason, previousStatus: org.status, previousBlacklistedAt: org.blacklistedAt?.toISOString() ?? null },
    } });
  });
}
