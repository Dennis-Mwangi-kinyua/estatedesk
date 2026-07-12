// src/features/issues/actions/create-caretaker-issue-action.ts

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCaretakerIssueHref } from "@/app/(app)/dashboard/caretaker/_lib/paths";
import { getCaretakerAllowedUnitIds } from "@/lib/caretaker/access";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { uploadIssuePhoto } from "./upload-issue-photo";

const createCaretakerIssueSchema = z.object({
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

export async function createCaretakerIssueAction(formData: FormData) {
  const session = await requireUserSession();

  const orgId = session.activeOrgId;
  const userId = session.userId;
  const role = session.activeOrgRole;

  if (!orgId) {
    redirect("/dashboard");
  }

  if (role !== "CARETAKER") {
    redirect("/dashboard");
  }

  const parsed = createCaretakerIssueSchema.parse({
    title: formValueToString(formData.get("title")),
    description: formValueToString(formData.get("description")),
    propertyId: formValueToString(formData.get("propertyId")),
    unitId: formValueToString(formData.get("unitId")),
    priority: formValueToString(formData.get("priority")) ?? "MEDIUM",
  });

  let propertyId = parsed.propertyId;
  const unitId = parsed.unitId;

  if (unitId) {
    const allowedUnitIds = await getCaretakerAllowedUnitIds({
      orgId,
      caretakerUserId: userId,
      membershipScope: session.membershipScope,
    });

    if (!allowedUnitIds.includes(unitId)) {
      redirect("/dashboard/caretaker/issues/new");
    }

    const unit = await prisma.unit.findFirst({
      where: {
        id: unitId,
        deletedAt: null,
        property: {
          orgId,
          deletedAt: null,
        },
      },
      select: {
        propertyId: true,
      },
    });

    if (!unit) {
      redirect("/dashboard/caretaker/issues/new");
    }

    propertyId = unit.propertyId;
  }

  const photo = formData.get("photo");
  let photoAssetId: string | undefined;

  if (photo instanceof File && photo.size > 0) {
    photoAssetId = await uploadIssuePhoto({
      photo,
      unitId,
      orgId,
      submittedByUserId: userId,
    });
  }

  const issue = await prisma.issueTicket.create({
    data: {
      orgId,
      reportedByUserId: userId,
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority,
      propertyId,
      unitId,
      photoAssetId,
      status: "OPEN",
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/dashboard/caretaker/issues");
  revalidatePath(getCaretakerIssueHref(issue.id));
  redirect(getCaretakerIssueHref(issue.id));
}