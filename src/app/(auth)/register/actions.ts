"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const onboardingRequestSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  companyName: z.string().trim().min(2).max(160),
  workEmail: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(40).optional(),
  managedPropertyType: z.string().trim().min(2).max(80),
  message: z.string().trim().max(1200).optional(),
});

function getClientIp(headerStore: Awaited<ReturnType<typeof headers>>) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headerStore.get("x-real-ip") ?? "unknown";
}

export async function createOnboardingRequestAction(formData: FormData) {
  const headerStore = await headers();
  const ipAddress = getClientIp(headerStore);
  const website = String(formData.get("website") ?? "").trim();

  if (website) {
    redirect("/register?request=sent#request-access");
  }

  const parsed = onboardingRequestSchema.safeParse({
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    workEmail: formData.get("workEmail"),
    phone: formData.get("phone") || undefined,
    managedPropertyType: formData.get("managedPropertyType"),
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) {
    redirect("/register?request=invalid#request-access");
  }

  const limiter = await checkRateLimit({
    key: `onboarding:${ipAddress}:${parsed.data.workEmail}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (!limiter.allowed) {
    redirect("/register?request=limited#request-access");
  }

  await prisma.$transaction(async (tx) => {
    await tx.onboardingRequest.create({
      data: {
        ...parsed.data,
        ipAddress,
        userAgent: headerStore.get("user-agent"),
      },
    });
  });

  revalidatePath("/platform/onboarding");
  revalidatePath("/platform/messages");
  revalidatePath("/platform/broadcasts");
  redirect("/register?request=sent#request-access");
}
