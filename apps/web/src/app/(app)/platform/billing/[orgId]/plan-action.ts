"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { lockOrgQuota } from "@/lib/billing/access";
import { organizationPlanPolicySchema } from "@/lib/billing/organization-plan-policy";
import { APP_PLANS } from "@/lib/billing/plans";

export async function saveOrganizationPlan(_state: { error?: string; success?: string }, form: FormData): Promise<{ error?: string; success?: string }> {
  const actor = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"]);
  const orgId = String(form.get("orgId") ?? "");
  try {
    const readLimit = (name: string) => {
      const value = String(form.get(name) ?? "").trim();
      if (!value) return null;
      if (!/^\d+$/.test(value)) throw new Error("Limits must be whole numbers from 0 to 1,000,000, or blank for unlimited.");
      return Number(value);
    };
    const parsed = organizationPlanPolicySchema.safeParse({
      plan: form.get("plan"), propertiesLimit: readLimit("propertiesLimit"),
      unitsLimit: readLimit("unitsLimit"), usersLimit: readLimit("usersLimit"),
      ...(form.get("plan") === "ENTERPRISE" ? { allowedViews: form.getAll("allowedViews") } : {}),
    });
    if (!parsed.success) return { error: "Choose a valid plan, sections and whole-number limits up to 1,000,000." };
    const policy = parsed.data;
    if (form.get("confirmed") !== "on") return { error: "Confirm this organization’s plan and access changes." };
    const slug = await prisma.$transaction(async tx => {
      await lockOrgQuota(tx, orgId);
      const org = await tx.organization.findFirst({ where: { id: orgId, deletedAt: null }, select: { slug: true } });
      const current = await tx.subscription.findUnique({ where: { orgId } });
      if (!org || !current) throw new Error("Organization subscription not found.");
      if (current.updatedAt.toISOString() !== form.get("revision")) throw new Error("Subscription changed. Reload this page before saving.");
      const metadata = current.metadata && typeof current.metadata === "object" && !Array.isArray(current.metadata) ? { ...current.metadata } : {};
      if (policy.plan !== current.plan) {
        if (policy.plan === "ENTERPRISE") delete metadata.amountDue;
        else metadata.amountDue = APP_PLANS[policy.plan].monthlyAmount;
        await tx.subscriptionPlanChange.create({ data: { subscriptionId: current.id, fromPlan: current.plan, toPlan: policy.plan, effectiveFrom: new Date(), reason: "Platform administrator organization-specific configuration" } });
      }
      if (form.get("reset") === "on") delete metadata.organizationPlan;
      else metadata.organizationPlan = policy as unknown as Prisma.JsonObject;
      await tx.subscription.update({ where: { orgId }, data: { plan: policy.plan, metadata: metadata as Prisma.InputJsonObject } });
      await tx.auditLog.create({ data: {
        orgId, actorUserId: actor.userId, action: "ORG_PLAN_CONFIGURATION_UPDATED", entityType: "Subscription", entityId: current.id,
        beforeState: { plan: current.plan, metadata: current.metadata },
        afterState: { plan: policy.plan, metadata: metadata as Prisma.InputJsonObject },
      } });
      return org.slug;
    });
    for (const path of [`/platform/billing/${orgId}`, `/platform/organizations/${slug}`, "/platform/billing", "/platform/subscriptions", "/dashboard"]) revalidatePath(path, "layout");
    return { success: "Organization plan, capacity and access saved. Existing records are retained; lower limits prevent new additions." };
  } catch (error) {
    return { error: error instanceof Error && !(error instanceof Prisma.PrismaClientKnownRequestError) ? error.message : "Could not save the organization plan." };
  }
}
