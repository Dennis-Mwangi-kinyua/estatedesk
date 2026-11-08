"use server";

import { expirePublicVacancies } from "@/lib/public-vacancy-cache";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { isOrganizationFeatureKey } from "@/lib/org/feature-controls";
import { updateOrganizationFeature } from "@/lib/org/update-feature";

export async function toggleOrganizationFeatureFlagAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], { redirectTo: "/dashboard" });
  const orgId = String(formData.get("orgId") ?? "").trim();
  const key = String(formData.get("featureKey") ?? "").trim();
  const value = formData.get("nextEnabled");
  if (!orgId || !isOrganizationFeatureKey(key) || (value !== "true" && value !== "false")) return;
  const org = await updateOrganizationFeature(prisma, { orgId, actorUserId: session.userId, key, enabled: value === "true" });
  if (!org) return;
  expirePublicVacancies();
  revalidatePath("/dashboard", "layout");
  revalidatePath("/platform/feature-flags");
  revalidatePath(`/platform/organizations/${org.slug}`);
}
