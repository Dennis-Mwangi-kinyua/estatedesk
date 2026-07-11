"use server";

import { NotificationChannel, NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { revalidatePublicVacancies } from "@/lib/public-vacancy-cache";
import { resolveVacancyUnitIdFromSlug } from "@/lib/public-vacancy-resolve";
import { ensureUnitPublicSlug } from "@/lib/public-vacancy-ensure-slug";
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
  const preferredLocation = optionalText(formData.get("preferredLocation"));
  const budget = optionalText(formData.get("budget"));
  const referralSource = optionalText(formData.get("referralSource"));
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
      isPubliclyListed: true,
      property: {
        isActive: true,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      houseNo: true,
      publicSlug: true,
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

  const canonicalSlug = await ensureUnitPublicSlug({
    id: unit.id,
    houseNo: unit.houseNo,
    publicSlug: unit.publicSlug,
    property: { name: unit.property.name },
  });

  const detailLines = [
    message,
    preferredLocation ? `Preferred location: ${preferredLocation}` : null,
    budget ? `Budget: ${budget}` : null,
    referralSource ? `Referral: ${referralSource}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await prisma.$transaction(async (tx) => {
    await tx.vacancyInquiry.create({
      data: {
        orgId: unit.property.orgId,
        unitId: unit.id,
        fullName,
        phone,
        email,
        message: detailLines,
        preferredLocation,
        budget,
        referralSource,
      },
    });

    await notifyRecipients({
      db: tx,
      orgId: unit.property.orgId,
      recipients: unit.property.org.memberships.map((member) => ({
        userId: member.userId,
      })),
      // Queue multi-channel delivery (cron/workers send EMAIL/SMS/WhatsApp/push).
      channels: [
        NotificationChannel.IN_APP,
        NotificationChannel.WEB_PUSH,
        NotificationChannel.EMAIL,
        NotificationChannel.SMS,
        NotificationChannel.WHATSAPP,
      ],
      type: NotificationType.GENERAL,
      title: "New vacancy enquiry",
      message: `${fullName} enquired about ${unit.property.name}, Unit ${unit.houseNo}. Phone: ${phone}.${email ? ` Email: ${email}.` : ""}`,
      actionUrl: "/dashboard/org/vacancy-inquiries",
      providerResponse: {
        source: "public_vacancy_enquiry",
        unitId: unit.id,
        enquirerEmail: email,
        enquirerPhone: phone,
      },
    });
  });

  revalidatePublicVacancies({
    unitId: unit.id,
    propertyName: unit.property.name,
    houseNo: unit.houseNo,
    publicSlug: canonicalSlug,
  });
  revalidatePath("/dashboard/org");
  revalidatePath("/dashboard/org/notifications");
  revalidatePath("/dashboard/org/vacancy-inquiries");
  redirect(`/vacancies/${canonicalSlug}?sent=1#enquire`);
}
