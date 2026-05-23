import type { Prisma } from "@prisma/client";

type MarketingDb = Prisma.TransactionClient | typeof import("@/lib/prisma").prisma;

export function normalizeReferralCode(value: string | null | undefined) {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function resolveMarketerReferral(db: MarketingDb, referralCode: string) {
  const normalized = normalizeReferralCode(referralCode);

  if (!normalized) {
    return {
      marketerId: null,
      referralCode: null,
      commissionRate: null,
    };
  }

  const marketer = await db.platformMarketer.findFirst({
    where: {
      referralCode: normalized,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      id: true,
      referralCode: true,
      defaultCommissionRate: true,
    },
  });

  if (!marketer) {
    return {
      marketerId: null,
      referralCode: normalized,
      commissionRate: null,
    };
  }

  return {
    marketerId: marketer.id,
    referralCode: marketer.referralCode,
    commissionRate: marketer.defaultCommissionRate,
  };
}

export async function findActiveMarketerByReferralCode(
  db: MarketingDb,
  referralCode: string,
) {
  const normalized = normalizeReferralCode(referralCode);

  if (!normalized) {
    return null;
  }

  return db.platformMarketer.findFirst({
    where: {
      referralCode: normalized,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: {
      fullName: true,
      referralCode: true,
    },
  });
}
