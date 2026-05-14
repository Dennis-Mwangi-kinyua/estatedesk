"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { normalizeReferralCode } from "@/lib/marketing/referrals";

const MARKETING_PATHS = [
  "/platform/marketing",
  "/platform/onboarding",
  "/platform/organizations",
  "/platform/broadcasts",
];

const commissionStatuses = ["PENDING", "APPROVED", "PAID", "CANCELLED"] as const;
const marketerStatuses = ["ACTIVE", "INACTIVE"] as const;

export type MarketingActionState = {
  ok: boolean;
  message: string;
};

const createMarketerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  referralCode: z.string().trim().min(2).max(40),
  defaultCommissionRate: z.coerce.number().min(0).max(100),
  notes: z.string().trim().max(1000).optional(),
});

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function revalidateMarketingViews() {
  for (const path of MARKETING_PATHS) {
    revalidatePath(path);
  }
}

function actionError(error: unknown, fallback: string): MarketingActionState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      ok: false,
      message: "That referral code is already in use.",
    };
  }

  if (error instanceof Error) {
    return {
      ok: false,
      message: error.message || fallback,
    };
  }

  return {
    ok: false,
    message: fallback,
  };
}

async function requirePlatformMarketingAccess() {
  return requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
}

export async function createMarketerAction(
  _state: MarketingActionState,
  formData: FormData,
): Promise<MarketingActionState> {
  await requirePlatformMarketingAccess();

  const parsed = createMarketerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    referralCode: normalizeReferralCode(readString(formData, "referralCode")),
    defaultCommissionRate: formData.get("defaultCommissionRate"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please provide a marketer name, referral code, and valid commission rate.",
    };
  }

  const data = parsed.data;

  try {
    await prisma.platformMarketer.create({
      data: {
        fullName: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        referralCode: normalizeReferralCode(data.referralCode),
        defaultCommissionRate: data.defaultCommissionRate,
        notes: data.notes || null,
      },
    });
  } catch (error) {
    return actionError(error, "Could not create marketer.");
  }

  revalidateMarketingViews();

  return {
    ok: true,
    message: "Marketer created.",
  };
}

export async function updateMarketerAction(
  _state: MarketingActionState,
  formData: FormData,
): Promise<MarketingActionState> {
  await requirePlatformMarketingAccess();

  const marketerId = readString(formData, "marketerId");
  const status = marketerStatuses.find((item) => item === readString(formData, "status").toUpperCase());
  const notes = readString(formData, "notes");
  const rate = Number(readString(formData, "defaultCommissionRate"));

  if (!marketerId) {
    return {
      ok: false,
      message: "Missing marketer id.",
    };
  }

  if (!status || !Number.isFinite(rate) || rate < 0 || rate > 100) {
    return {
      ok: false,
      message: "Commission rate must be between 0 and 100.",
    };
  }

  try {
    await prisma.platformMarketer.update({
      where: { id: marketerId },
      data: {
        status,
        defaultCommissionRate: rate,
        notes: notes || null,
        deletedAt: null,
      },
    });
  } catch (error) {
    return actionError(error, "Could not update marketer.");
  }

  revalidateMarketingViews();

  return {
    ok: true,
    message: "Marketer saved.",
  };
}

export async function updateLeadAttributionAction(
  _state: MarketingActionState,
  formData: FormData,
): Promise<MarketingActionState> {
  await requirePlatformMarketingAccess();

  const requestId = readString(formData, "requestId");
  const marketerId = readString(formData, "marketerId");
  const commissionStatus = commissionStatuses.find(
    (item) => item === readString(formData, "commissionStatus").toUpperCase(),
  );
  const commissionNotes = readString(formData, "commissionNotes");
  const commissionRateRaw = readString(formData, "commissionRate");
  const commissionRate = commissionRateRaw ? Number(commissionRateRaw) : null;

  if (!requestId || !commissionStatus) {
    return {
      ok: false,
      message: "Missing lead attribution details.",
    };
  }

  if (commissionRate !== null && (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100)) {
    return {
      ok: false,
      message: "Commission rate must be between 0 and 100.",
    };
  }

  try {
    const marketer =
      marketerId && marketerId !== "none"
        ? await prisma.platformMarketer.findFirst({
            where: { id: marketerId, deletedAt: null, status: "ACTIVE" },
            select: { id: true, referralCode: true, defaultCommissionRate: true },
          })
        : null;

    if (marketerId && marketerId !== "none" && !marketer) {
      return {
        ok: false,
        message: "Selected marketer is not active or no longer exists.",
      };
    }

    await prisma.onboardingRequest.update({
      where: { id: requestId },
      data: {
        marketerId: marketer?.id ?? null,
        referralCode: marketer?.referralCode ?? null,
        commissionRate: commissionRate ?? marketer?.defaultCommissionRate ?? null,
        commissionStatus,
        commissionNotes: commissionNotes || null,
      },
    });
  } catch (error) {
    return actionError(error, "Could not update lead attribution.");
  }

  revalidateMarketingViews();

  return {
    ok: true,
    message: "Lead attribution saved.",
  };
}

export async function updateOrganizationAttributionAction(
  _state: MarketingActionState,
  formData: FormData,
): Promise<MarketingActionState> {
  await requirePlatformMarketingAccess();

  const orgId = readString(formData, "orgId");
  const marketerId = readString(formData, "marketerId");
  const commissionStatus = commissionStatuses.find(
    (item) => item === readString(formData, "commissionStatus").toUpperCase(),
  );
  const commissionNotes = readString(formData, "commissionNotes");
  const commissionRateRaw = readString(formData, "commissionRate");
  const commissionRate = commissionRateRaw ? Number(commissionRateRaw) : null;

  if (!orgId || !commissionStatus) {
    return {
      ok: false,
      message: "Missing organization attribution details.",
    };
  }

  if (commissionRate !== null && (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100)) {
    return {
      ok: false,
      message: "Commission rate must be between 0 and 100.",
    };
  }

  try {
    const marketer =
      marketerId && marketerId !== "none"
        ? await prisma.platformMarketer.findFirst({
            where: { id: marketerId, deletedAt: null, status: "ACTIVE" },
            select: { id: true, referralCode: true, defaultCommissionRate: true },
          })
        : null;

    if (marketerId && marketerId !== "none" && !marketer) {
      return {
        ok: false,
        message: "Selected marketer is not active or no longer exists.",
      };
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        marketerId: marketer?.id ?? null,
        referralCode: marketer?.referralCode ?? null,
        commissionRate: commissionRate ?? marketer?.defaultCommissionRate ?? null,
        commissionStatus,
        commissionNotes: commissionNotes || null,
      },
    });
  } catch (error) {
    return actionError(error, "Could not update organization attribution.");
  }

  revalidateMarketingViews();

  return {
    ok: true,
    message: "Organization attribution saved.",
  };
}
