"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { canRedeemReward } from "@/lib/rewards/redeem";

/**
 * Tenant self-serve reward request (creates PENDING redemption for office fulfill).
 */
export async function requestTenantRewardAction(formData: FormData) {
  const session = await requireTenantAccess();
  const orgId = session.activeOrgId!;
  const rewardId = String(formData.get("rewardId") ?? "").trim();
  const tenantIdFromForm = String(formData.get("tenantId") ?? "").trim();

  if (!rewardId) {
    return { ok: false as const, message: "Choose a reward." };
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      orgId,
      userId: session.userId,
      deletedAt: null,
      ...(tenantIdFromForm ? { id: tenantIdFromForm } : {}),
    },
    select: {
      id: true,
      payments: {
        where: {
          OR: [
            { verificationStatus: { in: ["VERIFIED", "NOT_REQUIRED"] } },
            { gatewayStatus: "SUCCESS" },
          ],
        },
        select: {
          amount: true,
          paidAt: true,
          createdAt: true,
          verificationStatus: true,
          gatewayStatus: true,
        },
        take: 120,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tenant) {
    return { ok: false as const, message: "Tenant profile not found." };
  }

  const prior = await prisma.rentRewardRedemption.findMany({
    where: {
      orgId,
      tenantId: tenant.id,
      status: { in: ["PENDING", "FULFILLED"] },
    },
    select: { pointsCost: true },
  });
  const redeemedPoints = prior.reduce((s, r) => s + r.pointsCost, 0);

  const check = canRedeemReward({
    payments: tenant.payments.map((p) => ({
      paidAt: p.paidAt ?? p.createdAt,
      amount: Number(p.amount),
      verificationStatus: p.verificationStatus,
      gatewayStatus: p.gatewayStatus,
    })),
    redeemedPoints,
    rewardId,
  });

  if (!check.ok || !check.reward) {
    return {
      ok: false as const,
      message: "message" in check ? check.message : "Cannot redeem.",
    };
  }

  await prisma.rentRewardRedemption.create({
    data: {
      orgId,
      tenantId: tenant.id,
      rewardId: check.reward.id,
      label: check.reward.label,
      category: check.reward.category,
      pointsCost: check.reward.pointsCost,
      status: "PENDING",
      notes: "Requested by tenant portal",
    },
  });

  revalidatePath("/dashboard/tenant/rewards");
  revalidatePath(`/dashboard/org/tenants/${tenant.id}`);

  return {
    ok: true as const,
    message: `Requested ${check.reward.label}. Your office will fulfill the voucher.`,
  };
}
