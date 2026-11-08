import type { Prisma, PrismaClient } from "@prisma/client";
import { ORGANIZATION_PURGE_PLAN } from "./organization-purge-plan";

export const ORGANIZATION_RETENTION_DAYS = 30;
export const ORGANIZATION_DELETE_ACTION = "ORGANIZATION_DELETE_REQUESTED";

export function organizationPurgeWhere(now = new Date()): Prisma.OrganizationWhereInput {
  const cutoff = new Date(now.getTime() - ORGANIZATION_RETENTION_DAYS * 86400000);
  return { status: "DISABLED", deletedAt: { lte: cutoff }, auditLogs: {
    some: { action: ORGANIZATION_DELETE_ACTION, entityType: "Organization", createdAt: { lte: cutoff } },
  } };
}

/** Every delete is scoped to this organization; shared accounts are never traversed. */
export async function purgeOrganization(db: PrismaClient, orgId: string, now = new Date()) {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Organization" WHERE id = ${orgId} FOR UPDATE`;
    const eligible = await tx.organization.findFirst({ where: { id: orgId, ...organizationPurgeWhere(now) }, select: { id: true } });
    if (!eligible) return false;
    const assets = await tx.asset.findMany({ where: { orgId }, select: { metadata: true } });
    if (assets.some(asset => !asset.metadata || typeof asset.metadata !== "object" || Array.isArray(asset.metadata) || !asset.metadata.retentionFileRemovedAt)) throw new Error("Organization files must be removed before purging their references.");
    const remainingFiles = await Promise.all([
      tx.leaseSignatureSigner.count({ where: { envelope: { orgId }, signatureAssetKey: { not: null } } }),
      tx.accountingRequest.count({ where: { orgId, attachmentKey: { not: null } } }),
      tx.accountingVendorBill.count({ where: { orgId, attachmentKey: { not: null } } }),
      tx.expenditure.count({ where: { orgId, attachmentKey: { not: null } } }),
    ]);
    if (remainingFiles.some(Boolean)) throw new Error("Organization attachments still need cleanup.");
    for (const entry of ORGANIZATION_PURGE_PLAN) {
      const where = entry.path.reduceRight<Record<string, unknown> | string>((value, key) => ({ [key]: value }), orgId);
      // Generated delegates share deleteMany's contract; the schema coverage test checks the plan.
      const delegate = tx[entry.delegate] as unknown as { deleteMany(args: { where: unknown }): Promise<unknown> };
      await delegate.deleteMany({ where });
    }
    await tx.organization.delete({ where: { id: orgId } });
    return true;
  }, { timeout: 45000 });
}
