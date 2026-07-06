"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireOrgPermission } from "@/lib/permissions/guards";
import { notifyInAppAndPush } from "@/lib/notifications/notify";
import { prisma } from "@/lib/prisma";

const createOrgIssueSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

function formValueToString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function createOrgIssueAction(formData: FormData) {
  const session = await requireOrgPermission("maintenance.manage");
  const orgId = session.activeOrgId;

  if (!orgId || !session.userId) {
    redirect("/dashboard");
  }

  const parsed = createOrgIssueSchema.parse({
    title: formValueToString(formData.get("title")),
    description: formValueToString(formData.get("description")),
    propertyId: formValueToString(formData.get("propertyId")),
    unitId: formValueToString(formData.get("unitId")),
    priority: formValueToString(formData.get("priority")) ?? "MEDIUM",
  });

  if (parsed.propertyId) {
    const property = await prisma.property.findFirst({
      where: {
        id: parsed.propertyId,
        orgId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!property) {
      redirect("/dashboard/org/issues/new?error=invalid_property");
    }
  }

  if (parsed.unitId) {
    const unit = await prisma.unit.findFirst({
      where: {
        id: parsed.unitId,
        deletedAt: null,
        property: {
          orgId,
          deletedAt: null,
        },
        ...(parsed.propertyId ? { propertyId: parsed.propertyId } : {}),
      },
      select: { id: true },
    });

    if (!unit) {
      redirect("/dashboard/org/issues/new?error=invalid_unit");
    }
  }

  const unitDetails = parsed.unitId
    ? await prisma.unit.findUnique({
        where: { id: parsed.unitId },
        select: {
          houseNo: true,
          property: { select: { name: true } },
          building: { select: { name: true } },
        },
      })
    : parsed.propertyId
      ? await prisma.property.findUnique({
          where: { id: parsed.propertyId },
          select: { name: true },
        })
      : null;

  const locationText =
    unitDetails && "houseNo" in unitDetails
      ? [
          unitDetails.property.name,
          unitDetails.building?.name,
          unitDetails.houseNo ? `Unit ${unitDetails.houseNo}` : null,
        ]
          .filter(Boolean)
          .join(" / ")
      : unitDetails && "name" in unitDetails
        ? unitDetails.name
        : "the portfolio";

  const orgReviewers = await prisma.membership.findMany({
    where: {
      orgId,
      role: { in: ["ADMIN", "MANAGER", "OFFICE"] },
      userId: { not: session.userId },
      user: {
        deletedAt: null,
        status: "ACTIVE",
      },
    },
    select: { userId: true },
  });

  const issue = await prisma.$transaction(async (tx) => {
    const created = await tx.issueTicket.create({
      data: {
        orgId,
        reportedByUserId: session.userId!,
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority,
        propertyId: parsed.propertyId,
        unitId: parsed.unitId,
        status: "OPEN",
      },
    });

    if (orgReviewers.length > 0) {
      await notifyInAppAndPush({
        db: tx,
        orgId,
        recipients: orgReviewers.map(({ userId }) => ({ userId })),
        type: "ISSUE_CREATED",
        title: "New maintenance issue",
        message: `A new issue "${parsed.title}" was logged for ${locationText}. Priority: ${parsed.priority}.`,
        actionUrl: `/dashboard/org/issues?issueId=${created.id}`,
      });
    }

    return created;
  });

  revalidatePath("/dashboard/org/issues");
  redirect(`/dashboard/org/issues?issueId=${issue.id}`);
}