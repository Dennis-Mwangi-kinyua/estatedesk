"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writePlatformAuditLog } from "@/lib/audit/security";
import {
  applyUpgradeRequest,
  rejectUpgradeRequest,
} from "@/lib/billing/upgrade-requests";
import { requirePlatformRole } from "@/lib/permissions/guards";

const PAGE = "/platform/billing";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function applyUpgradeRequestAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const orgId = readString(formData, "orgId");
  const paymentReference = readString(formData, "paymentReference") || null;
  const notes = readString(formData, "notes") || null;

  if (!orgId) {
    redirect(`${PAGE}?error=upgrade-org`);
  }

  try {
    const result = await applyUpgradeRequest({
      orgId,
      actorUserId: session.userId,
      paymentReference,
      notes,
      status: "ACTIVE",
    });

    await writePlatformAuditLog({
      actorUserId: session.userId,
      action: "PLATFORM_UPGRADE_REQUEST_APPLIED",
      entityType: "Subscription",
      entityId: result.subscription.id,
      metadata: {
        orgId: result.org.id,
        slug: result.org.slug,
        fromPlan: result.fromPlan,
        toPlan: result.toPlan,
        paymentReference,
        notes,
      },
    });
  } catch (error) {
    console.error("[applyUpgradeRequestAction]", error);
    redirect(
      `${PAGE}?error=upgrade-apply&message=${encodeURIComponent(
        error instanceof Error ? error.message : "Apply failed",
      )}`,
    );
  }

  revalidatePath(PAGE);
  revalidatePath("/platform/subscriptions");
  revalidatePath("/dashboard/org/settings");
  redirect(`${PAGE}?ok=upgrade-applied`);
}

export async function rejectUpgradeRequestAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });

  const orgId = readString(formData, "orgId");
  const notes = readString(formData, "notes") || null;

  if (!orgId) {
    redirect(`${PAGE}?error=upgrade-org`);
  }

  try {
    const result = await rejectUpgradeRequest({
      orgId,
      actorUserId: session.userId,
      notes,
    });

    await writePlatformAuditLog({
      actorUserId: session.userId,
      action: "PLATFORM_UPGRADE_REQUEST_REJECTED",
      entityType: "Subscription",
      entityId: orgId,
      metadata: {
        orgId: result.org.id,
        slug: result.org.slug,
        requestedPlan: result.request.plan,
        notes,
      },
    });
  } catch (error) {
    console.error("[rejectUpgradeRequestAction]", error);
    redirect(
      `${PAGE}?error=upgrade-reject&message=${encodeURIComponent(
        error instanceof Error ? error.message : "Reject failed",
      )}`,
    );
  }

  revalidatePath(PAGE);
  revalidatePath("/dashboard/org/settings");
  redirect(`${PAGE}?ok=upgrade-rejected`);
}
