/**
 * RentRewards redemption catalog + fulfillment helpers.
 */

import { computeRentRewards, type PaymentForReward } from "@/lib/rewards/rent-rewards";

export type RedeemableReward = {
  id: string;
  label: string;
  pointsCost: number;
  category: "shopping" | "data" | "insurance";
  description: string;
};

export const REWARD_CATALOG: RedeemableReward[] = [
  {
    id: "data-1gb",
    label: "1GB internet data bundle",
    pointsCost: 40,
    category: "data",
    description: "Partner airtime/data voucher for early payers.",
  },
  {
    id: "shop-500",
    label: "KES 500 shopping token",
    pointsCost: 80,
    category: "shopping",
    description: "Digital shopping credit for partner retailers.",
  },
  {
    id: "insure-disc",
    label: "Insurance premium discount voucher",
    pointsCost: 120,
    category: "insurance",
    description: "Discount voucher for tenant contents insurance partners.",
  },
  {
    id: "data-5gb",
    label: "5GB internet data bundle",
    pointsCost: 150,
    category: "data",
    description: "Larger data bundle for consistent early payers.",
  },
  {
    id: "shop-2000",
    label: "KES 2,000 shopping token",
    pointsCost: 280,
    category: "shopping",
    description: "Higher-value shopping token for platinum-tier loyalty.",
  },
];

export function getRewardById(rewardId: string) {
  return REWARD_CATALOG.find((r) => r.id === rewardId) ?? null;
}

export function availablePoints(
  payments: PaymentForReward[],
  redeemedPoints: number,
) {
  const snapshot = computeRentRewards(payments);
  return Math.max(0, snapshot.points - Math.max(0, redeemedPoints));
}

export function canRedeemReward(input: {
  payments: PaymentForReward[];
  redeemedPoints: number;
  rewardId: string;
}) {
  const reward = getRewardById(input.rewardId);
  if (!reward) {
    return { ok: false as const, message: "Unknown reward." };
  }
  const points = availablePoints(input.payments, input.redeemedPoints);
  if (points < reward.pointsCost) {
    return {
      ok: false as const,
      message: `Need ${reward.pointsCost} pts (available ${points}).`,
      reward,
      points,
    };
  }
  return { ok: true as const, reward, points };
}
