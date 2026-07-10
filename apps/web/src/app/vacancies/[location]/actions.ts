"use server";

import { NotificationChannel, NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";
import { resolveVacancyUnitIdFromSlug } from "@/lib/public-vacancy-resolve";
import { vacancyPublicSlug } from "@/lib/public-vacancy-slug";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notifyRecipients } from "@/lib/notifications/notify";
import { checkRateLimit } from "@/lib/rate-limit";

function requiredText(value: FormDataEntryValue | null, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
}

function optionalText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getClientIp(headerStore: Awaited<ReturnType<typeof headers>>) {
  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return headerStore.get("x-real-ip") ?? "unknown";
}

export async function sendVacancyInquiryAction(publicSlug: string, formData: FormData) {
  const headerStore = await headers();
  const ipAddress = getClientIp(headerStore);
  const website = optionalText(formData.get("website"));

  if (website) {
    redirect(`/vacancies/${publicSlug}?sent=1#enquire`);
  }

  const limiter = await checkRateLimit({
    key: `vacancy-inquiry:${ipAddress}:${publicSlug}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!limiter.allowed) {
    redirect(
      `/vacancies/${publicSlug}?error=${encodeURIComponent(
        "Too many enquiries. Please wait before sending another message.",
      )}#enquire`,
    );
  }

  const fullName = requiredText(formData.get("fullName"), "Name");
  const phone = requiredText(formData.get("phone"), "Phone");
  const email = optionalText(formData.get("email"));
  const message = requiredText(formData.get("message"), "Message");
  const unitId = await resolveVacancyUnitIdFromSlug(publicSlug);

  if (!unitId) {
    redirect(
      `/vacancies/${publicSlug}?error=${encodeURIComponent("This vacancy is no longer available.")}`,
    );
  }

  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      isActive: true,
      deletedAt: null,
      status: "VACANT",
      property: {
        isActive: true,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      houseNo: true,
      property: {
        select: {
          orgId: true,
          name: true,
          org: {
            select: {
              memberships: {
                where: {
                  role: { in: ["ADMIN", "MANAGER", "OFFICE"] },
                  employmentEndedAt: null,
                  deactivatedAt: null,
                },
                select: { userId: true },
              },
            },
          },
        },
      },
    },
  });

  if (!unit) {
    redirect(
      `/vacancies/${publicSlug}?error=${encodeURIComponent("This vacancy is no longer available.")}`,
    );
  }

  const canonicalSlug = vacancyPublicSlug({
    propertyName: unit.property.name,
    houseNo: unit.houseNo,
  });

  await prisma.$transaction(async (tx) => {
    await tx.vacancyInquiry.create({
      data: {
        orgId: unit.property.orgId,
        unitId: unit.id,
        fullName,
        phone,
        email,
        message,
      },
    });

    await notifyRecipients({
      db: tx,
      orgId: unit.property.orgId,
      recipients: unit.property.org.memberships.map((member) => ({ userId: member.userId })),
      channels: [NotificationChannel.IN_APP],
      type: NotificationType.GENERAL,
      title: "New vacancy enquiry",
      message: `${fullName} enquired about ${unit.property.name}, Unit ${unit.houseNo}. Phone: ${phone}.`,
    });
  });

  revalidatePublicVacancies({
    unitId: unit.id,
    propertyName: unit.property.name,
    houseNo: unit.houseNo,
  });
  revalidatePath("/dashboard/org");
  revalidatePath("/dashboard/org/notifications");
  redirect(`/vacancies/${canonicalSlug}?sent=1#enquire`);
}