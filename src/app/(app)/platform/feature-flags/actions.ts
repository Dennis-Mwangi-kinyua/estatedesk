"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { writePlatformAuditLog } from "@/lib/audit/security";
import { requirePlatformRole } from "@/lib/permissions/guards";
import {
  PLATFORM_FEATURE_FLAG_KEYS,
  type PlatformFeatureFlagKey,
} from "../_lib/nav";

const PAGE_PATH = "/platform/feature-flags";

function isFeatureKey(value: string): value is PlatformFeatureFlagKey {
  return (PLATFORM_FEATURE_FLAG_KEYS as readonly string[]).includes(value);
}

function asFeatureMap(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, boolean> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = Boolean(item);
  }
  return result;
}

export async function toggleOrganizationFeatureFlagAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const orgId = String(formData.get("orgId") ?? "").trim();
  const featureKey = String(formData.get("featureKey") ?? "").trim();
  const nextEnabled = String(formData.get("nextEnabled") ?? "") === "true";

  if (!orgId || !isFeatureKey(featureKey)) {
    return;
  }

  const org = await prisma.organization.findFirst({
    where: { id: orgId, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      settings: { select: { id: true, features: true } },
    },
  });

  if (!org) return;

  const previous = asFeatureMap(org.settings?.features);
  const next = { ...previous, [featureKey]: nextEnabled };

  const featuresJson = next as Prisma.InputJsonObject;

  const settings = await prisma.organizationSettings.upsert({
    where: { orgId },
    create: {
      orgId,
      features: featuresJson,
    },
    update: {
      features: featuresJson,
    },
    select: { id: true },
  });

  await writePlatformAuditLog({
    actorUserId: session.userId,
    action: "PLATFORM_FEATURE_FLAG_UPDATED",
    entityType: "OrganizationSettings",
    entityId: settings.id,
    metadata: {
      orgId,
      orgSlug: org.slug,
      featureKey,
      enabled: nextEnabled,
    },
    beforeState: previous,
    afterState: next,
  });

  revalidatePath(PAGE_PATH);
  revalidatePath(`/platform/organizations/${org.slug}`);
}
