/**
 * RentRewards — tenant loyalty engine foundation.
 *
 * Tracks early / on-time payments and converts them into reward points
 * redeemable later for shopping tokens, data bundles, or insurance discounts
 * (redemption partners are pluggable; this module is ledger-side only).
 */

export type RewardTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export type PaymentForReward = {
  paidAt: Date | string;
  amount: number;
  /** Charge due date for the period this payment covered (optional). */
  dueDate?: Date | string | null;
  verificationStatus?: string | null;
  gatewayStatus?: string | null;
};

export type RentRewardsSnapshot = {
  points: number;
  tier: RewardTier;
  earlyPayments: number;
  onTimePayments: number;
  latePayments: number;
  qualifyingPayments: number;
  streakMonths: number;
  nextTier: RewardTier | null;
  pointsToNextTier: number | null;
  suggestedRewards: Array<{
    id: string;
    label: string;
    pointsCost: number;
    category: "shopping" | "data" | "insurance";
  }>;
};

const TIER_THRESHOLDS: Array<{ tier: RewardTier; minPoints: number }> = [
  { tier: "PLATINUM", minPoints: 500 },
  { tier: "GOLD", minPoints: 250 },
  { tier: "SILVER", minPoints: 100 },
  { tier: "BRONZE", minPoints: 0 },
];

const CATALOG: RentRewardsSnapshot["suggestedRewards"] = [
  {
    id: "data-1gb",
    label: "1GB internet data bundle",
    pointsCost: 40,
    category: "data",
  },
  {
    id: "shop-500",
    label: "KES 500 shopping token",
    pointsCost: 80,
    category: "shopping",
  },
  {
    id: "insure-disc",
    label: "Insurance premium discount voucher",
    pointsCost: 120,
    category: "insurance",
  },
  {
    id: "data-5gb",
    label: "5GB internet data bundle",
    pointsCost: 150,
    category: "data",
  },
  {
    id: "shop-2000",
    label: "KES 2,000 shopping token",
    pointsCost: 280,
    category: "shopping",
  },
];

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isVerified(payment: PaymentForReward) {
  const v = (payment.verificationStatus || "").toUpperCase();
  const g = (payment.gatewayStatus || "").toUpperCase();
  if (v === "REJECTED" || v === "FAILED") return false;
  if (g === "FAILED" || g === "CANCELLED") return false;
  return (
    v === "VERIFIED" ||
    v === "NOT_REQUIRED" ||
    g === "SUCCESS" ||
    !payment.verificationStatus
  );
}

/** Points for a single payment relative to due date. */
export function pointsForPayment(payment: PaymentForReward): {
  points: number;
  kind: "early" | "on_time" | "late" | "skipped";
} {
  if (!isVerified(payment) || payment.amount <= 0) {
    return { points: 0, kind: "skipped" };
  }

  const paidAt = toDate(payment.paidAt);
  if (!paidAt) return { points: 0, kind: "skipped" };

  const due = toDate(payment.dueDate);
  if (!due) {
    // No due date: award base on-time points for verified payment.
    return { points: 10, kind: "on_time" };
  }

  const paidDay = startOfDay(paidAt).getTime();
  const dueDay = startOfDay(due).getTime();
  const dayDiff = Math.round((dueDay - paidDay) / (24 * 60 * 60 * 1000));

  if (dayDiff >= 3) {
    // 3+ days early
    return { points: 25, kind: "early" };
  }
  if (dayDiff >= 0) {
    // On or before due date
    return { points: 15, kind: "on_time" };
  }
  if (dayDiff >= -5) {
    // Slightly late — token points only
    return { points: 2, kind: "late" };
  }
  return { points: 0, kind: "late" };
}

export function tierForPoints(points: number): RewardTier {
  for (const row of TIER_THRESHOLDS) {
    if (points >= row.minPoints) return row.tier;
  }
  return "BRONZE";
}

export function nextTierProgress(points: number): {
  nextTier: RewardTier | null;
  pointsToNextTier: number | null;
} {
  const ordered = [...TIER_THRESHOLDS].reverse();
  for (const row of ordered) {
    if (points < row.minPoints) {
      return {
        nextTier: row.tier,
        pointsToNextTier: row.minPoints - points,
      };
    }
  }
  return { nextTier: null, pointsToNextTier: null };
}

/**
 * Build loyalty snapshot from payment history (newest-first or any order).
 * Streak counts consecutive months with early/on-time payments from latest.
 */
export function computeRentRewards(
  payments: PaymentForReward[],
): RentRewardsSnapshot {
  let points = 0;
  let earlyPayments = 0;
  let onTimePayments = 0;
  let latePayments = 0;
  let qualifyingPayments = 0;

  const monthKeys = new Set<string>();
  const goodMonths = new Set<string>();

  for (const payment of payments) {
    const result = pointsForPayment(payment);
    if (result.kind === "skipped") continue;

    points += result.points;
    qualifyingPayments += 1;
    if (result.kind === "early") earlyPayments += 1;
    else if (result.kind === "on_time") onTimePayments += 1;
    else latePayments += 1;

    const paidAt = toDate(payment.paidAt);
    if (paidAt) {
      const key = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, "0")}`;
      monthKeys.add(key);
      if (result.kind === "early" || result.kind === "on_time") {
        goodMonths.add(key);
      }
    }
  }

  // Streak: walk back from current month
  const now = new Date();
  let streakMonths = 0;
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (goodMonths.has(key)) streakMonths += 1;
    else if (i > 0) break;
  }

  // Streak bonus
  if (streakMonths >= 6) points += 30;
  else if (streakMonths >= 3) points += 15;

  const tier = tierForPoints(points);
  const { nextTier, pointsToNextTier } = nextTierProgress(points);

  return {
    points,
    tier,
    earlyPayments,
    onTimePayments,
    latePayments,
    qualifyingPayments,
    streakMonths,
    nextTier,
    pointsToNextTier,
    suggestedRewards: CATALOG.filter((item) => item.pointsCost <= points + 50),
  };
}
