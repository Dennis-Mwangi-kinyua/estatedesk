"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { resolveMarketerReferral } from "@/lib/marketing/referrals";

const salesContactSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(2).max(160),
  workEmail: z
    .string()
    .trim()
    .email()
    .max(160)
    .transform((value) => value.toLowerCase()),
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

export async function contactSalesAction(formData: FormData) {
  const headerStore = await headers();
  const ipAddress = getClientIp(headerStore);
  const website = String(formData.get("website") ?? "").trim();

  if (website) {
    redirect("/contact?request=sent#contact-sales");
  }

  const parsed = salesContactSchema.safeParse({
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    workEmail: formData.get("workEmail"),
    phone: formData.get("phone") || undefined,
    managedPropertyType: formData.get("managedPropertyType"),
    message: formData.get("message") || undefined,
    referralCode: formData.get("referralCode") || undefined,
  });

  if (!parsed.success) {
    redirect("/contact?request=invalid#contact-sales");
  }

  const limiter = await checkRateLimit({
    key: `sales-contact:${ipAddress}:${parsed.data.workEmail}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (!limiter.allowed) {
    redirect("/contact?request=limited#contact-sales");
  }

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
        message: parsed.data.message,
        marketerId: attribution.marketerId,
        referralCode: attribution.referralCode,
        commissionRate: attribution.commissionRate,
        source: "CONTACT_SALES_PAGE",
        ipAddress,
        userAgent: headerStore.get("user-agent"),
      },
    });
  });

  revalidatePath("/platform/onboarding");
  revalidatePath("/platform/messages");
  revalidatePath("/platform/broadcasts");
  redirect("/contact?request=sent#contact-sales");
}
