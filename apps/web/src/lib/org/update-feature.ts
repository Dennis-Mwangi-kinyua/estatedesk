import type { PrismaClient } from "@prisma/client";
import { parseFeatureMap } from "./features";
import { isOrganizationFeatureKey, type OrganizationFeatureKey } from "./feature-controls";

export async function updateOrganizationFeature(db: PrismaClient, input: { orgId: string; actorUserId: string; key: OrganizationFeatureKey; enabled: boolean }) {
  if (!isOrganizationFeatureKey(input.key)) throw new Error("Unknown organization feature.");
  return db.$transaction(async tx => {
    // Serialize per organization so simultaneous changes cannot replace each other's keys.
    await tx.$queryRaw`SELECT id FROM "Organization" WHERE id = ${input.orgId} FOR UPDATE`;
    const org = await tx.organization.findFirst({ where: { id: input.orgId, deletedAt: null }, select: { id: true, slug: true, settings: { select: { features: true } } } });
    if (!org) return null;
    const previous = parseFeatureMap(org.settings?.features);
    const next = { ...previous, [input.key]: input.enabled };
    const settings = await tx.organizationSettings.upsert({ where: { orgId: org.id }, create: { orgId: org.id, features: next }, update: { features: next }, select: { id: true } });
    await tx.auditLog.create({ data: {
      orgId: org.id, actorUserId: input.actorUserId, action: "PLATFORM_FEATURE_FLAG_UPDATED",
      entityType: "OrganizationSettings", entityId: settings.id,
      metadata: { orgId: org.id, orgSlug: org.slug, featureKey: input.key, enabled: input.enabled }, beforeState: previous, afterState: next,
    } });
    return { slug: org.slug };
  });
}
