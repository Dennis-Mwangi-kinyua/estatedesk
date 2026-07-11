"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/permissions/guards";
import { canRedeemReward } from "@/lib/rewards/redeem";

export async function redeemRentRewardAction(formData: FormData) {
  const session = await requireOrgRole([
    "ADMIN",
    "MANAGER",
    "OFFICE",
    "ACCOUNTANT",
  ]);
  const orgId = session.activeOrgId!;
  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const rewardId = String(formData.get("rewardId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!tenantId || !rewardId) {
    return { ok: false as const, message: "Tenant and reward are required." };
  }

  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, orgId, deletedAt: null },
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
    return { ok: false as const, message: "Tenant not found." };
  }

  let redeemedPoints = 0;
  try {
    const prior = await prisma.rentRewardRedemption.findMany({
      where: {
        orgId,
        tenantId,
        status: { in: ["PENDING", "FULFILLED"] },
      },
      select: { pointsCost: true },
    });
    redeemedPoints = prior.reduce((s, r) => s + r.pointsCost, 0);
  } catch {
    redeemedPoints = 0;
  }

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

  try {
    await prisma.rentRewardRedemption.create({
      data: {
        orgId,
        tenantId,
        rewardId: check.reward.id,
        label: check.reward.label,
        category: check.reward.category,
        pointsCost: check.reward.pointsCost,
        status: "PENDING",
        notes,
      },
    });
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error
          ? `Could not save redemption (run migrations?): ${error.message}`
          : "Could not save redemption.",
    };
  }

  revalidatePath(`/dashboard/org/tenants/${tenantId}`);
  return {
    ok: true as const,
    message: `Redeemed ${check.reward.label} (${check.reward.pointsCost} pts). Mark fulfilled when voucher is issued.`,
  };
}

export async function fulfillRentRewardAction(formData: FormData) {
  const session = await requireOrgRole([
    "ADMIN",
    "MANAGER",
    "OFFICE",
    "ACCOUNTANT",
  ]);
  const orgId = session.activeOrgId!;
  const redemptionId = String(formData.get("redemptionId") ?? "").trim();
  const tenantId = String(formData.get("tenantId") ?? "").trim();

  if (!redemptionId) {
    return { ok: false as const, message: "Redemption id required." };
  }

  try {
    await prisma.rentRewardRedemption.updateMany({
      where: { id: redemptionId, orgId },
      data: { status: "FULFILLED", fulfilledAt: new Date() },
    });
  } catch {
    return {
      ok: false as const,
      message: "Could not fulfill (check migrations).",
    };
  }

  if (tenantId) revalidatePath(`/dashboard/org/tenants/${tenantId}`);
  return { ok: true as const, message: "Reward marked fulfilled." };
}
