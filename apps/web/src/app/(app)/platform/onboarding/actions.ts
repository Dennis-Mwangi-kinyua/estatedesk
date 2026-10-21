"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePlatformRole } from "@/lib/permissions/guards";
import { isOnboardingAlertPending, ONBOARDING_REQUEST_STATUSES } from "@/lib/platform/onboarding-status";

const PAGE_PATHS = ["/platform", "/platform/onboarding", "/platform/messages", "/platform/broadcasts"];

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function revalidateOnboardingViews() {
  for (const path of PAGE_PATHS) {
    revalidatePath(path);
  }
}

export async function updateOnboardingRequestAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const requestId = readString(formData, "requestId");
  const statusRaw = readString(formData, "status").toUpperCase();
  const internalNotes = readString(formData, "internalNotes");
  const status = ONBOARDING_REQUEST_STATUSES.find((item) => item === statusRaw);

  if (!requestId) {
    throw new Error("Missing onboarding request id.");
  }

  if (!status) {
    throw new Error("Invalid onboarding status.");
  }

  await prisma.onboardingRequest.update({
    where: { id: requestId },
    data: {
      status,
      internalNotes: internalNotes || null,
      handledAt: isOnboardingAlertPending(status) ? null : new Date(),
      handledByUserId: isOnboardingAlertPending(status) ? null : session.userId,
    },
  });

  revalidateOnboardingViews();
}

export async function quickUpdateOnboardingStatusAction(formData: FormData) {
  const session = await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const requestId = readString(formData, "requestId");
  const statusRaw = readString(formData, "status").toUpperCase();
  const status = ONBOARDING_REQUEST_STATUSES.find((item) => item === statusRaw);

  if (!requestId) {
    throw new Error("Missing onboarding request id.");
  }

  if (!status) {
    throw new Error("Invalid onboarding status.");
  }

  await prisma.onboardingRequest.update({
    where: { id: requestId },
    data: {
      status,
      handledAt: isOnboardingAlertPending(status) ? null : new Date(),
      handledByUserId: isOnboardingAlertPending(status) ? null : session.userId,
    },
  });

  revalidateOnboardingViews();
}

export async function deleteOnboardingRequestAction(formData: FormData) {
  await requirePlatformRole(["SUPER_ADMIN", "PLATFORM_ADMIN"], {
    redirectTo: "/dashboard",
  });
  const requestId = readString(formData, "requestId");

  if (!requestId) {
    throw new Error("Missing onboarding request id.");
  }

  await prisma.onboardingRequest.deleteMany({
    where: { id: requestId },
  });

  revalidateOnboardingViews();
}
