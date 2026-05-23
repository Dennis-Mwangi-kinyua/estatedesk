// src/features/issues/actions/create-caretaker-issue-action.ts

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

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

  await prisma.issueTicket.create({
    data: {
      orgId,
      reportedByUserId: userId,
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority,
      propertyId: parsed.propertyId,
      unitId: parsed.unitId,
      status: "OPEN",
    },
  });

  revalidatePath("/dashboard/caretaker/issues");
  redirect("/dashboard/caretaker/issues");
}