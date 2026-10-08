"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveMarketerReferral } from "@/lib/marketing/referrals";

const onboardingRequestSchema = z.object({
  accountType: z.enum(["PROPERTY_MANAGER", "LANDLORD"]),
  fullName: z.string().trim().min(2, "Enter your full name (at least 2 characters).").max(120),
  companyName: z.string().trim().min(2, "Enter an agency or portfolio name (at least 2 characters).").max(160),
  workEmail: z.string().trim().email("Enter a valid email address.").max(160).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(40).optional(),
  managedPropertyType: z.string().trim().min(2).max(80),
  message: z.string().trim().max(1200).optional(),
  referralCode: z.string().trim().max(40).optional(),
});

function getClientIp(headerStore: Awaited<ReturnType<typeof headers>>) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headerStore.get("x-real-ip") ?? "unknown";
}

export type OnboardingRequestState = { error?: string; fieldErrors?: Record<string, string[] | undefined> };

export async function createOnboardingRequestAction(_previous: OnboardingRequestState, formData: FormData): Promise<OnboardingRequestState> {
  const headerStore = await headers();
  const ipAddress = getClientIp(headerStore);
  const website = String(formData.get("website") ?? "").trim();

  if (website) {
    redirect("/register?request=sent#request-access");
  }

  const { getPlatformControl } = await import("@/lib/platform/control");
  const control = await getPlatformControl();
  if (control.publicSignupDisabled || control.maintenanceMode) {
    return { error: "New access requests are temporarily paused. Please try again later." };
  }

  const parsed = onboardingRequestSchema.safeParse({
    accountType: formData.get("accountType"),
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    workEmail: formData.get("workEmail"),
    phone: formData.get("phone") || undefined,
    managedPropertyType: formData.get("managedPropertyType"),
    message: formData.get("message") || undefined,
    referralCode: formData.get("referralCode") || undefined,
  });

  if (!parsed.success) {
    return { error: "Please check the highlighted details below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const limiter = await checkRateLimit({
    key: `onboarding:${ipAddress}:${parsed.data.workEmail}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (!limiter.allowed) {
    return { error: "You have submitted several requests recently. Please try again in an hour." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const attribution = await resolveMarketerReferral(
        tx,
        parsed.data.referralCode ?? "",
      );

      await tx.onboardingRequest.create({
        data: {
          fullName: parsed.data.fullName,
          companyName: parsed.data.companyName,
          workEmail: parsed.data.workEmail,
          phone: parsed.data.phone,
          managedPropertyType: parsed.data.managedPropertyType,
          message: `Account type: ${parsed.data.accountType === "LANDLORD" ? "Landlord" : "Property management agency"}\n${parsed.data.message ?? ""}`,
          marketerId: attribution.marketerId,
          referralCode: attribution.referralCode,
          commissionRate: attribution.commissionRate,
          ipAddress,
          userAgent: headerStore.get("user-agent"),
        },
      });
    });
  } catch {
    return { error: "We could not save your request. Your details are still here; please try again." };
  }

  revalidatePath("/platform/onboarding");
  revalidatePath("/platform/messages");
  revalidatePath("/platform/broadcasts");
  redirect("/register?request=sent#request-access");
}
