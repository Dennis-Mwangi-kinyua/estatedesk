// src/features/staff/actions/unlink-caretaker-assignment.ts
"use server";

import { LeaseStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

function getActorUserId(session: unknown) {
  return (session as { userId?: string; user?: { id?: string } }).userId
    ?? (session as { user?: { id?: string } }).user?.id
    ?? null;
}

export async function unlinkCaretakerAssignmentAction(formData: FormData) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    throw new Error("No active organisation found.");
  }

  const orgId = session.activeOrgId;

  const actorUserId = getActorUserId(session);
  if (!actorUserId) {
    throw new Error("Could not resolve the current user.");
  }

  const assignmentId = String(formData.get("assignmentId") ?? "");
  const membershipId = String(formData.get("membershipId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!assignmentId || !membershipId) {
    throw new Error("Assignment id and membership id are required.");
  }

  const assignment = await prisma.caretakerAssignment.findFirst({
    where: {
      id: assignmentId,
      orgId,
    },
    select: {
      id: true,
      orgId: true,
      caretakerUserId: true,
      propertyId: true,
      buildingId: true,
      unitId: true,
      active: true,
      notes: true,
    },
  });

  if (!assignment) {
    throw new Error("Caretaker assignment not found.");
  }

  if (!assignment.active) {
    throw new Error("This assignment is already inactive.");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.caretakerAssignment.update({
      where: { id: assignment.id },
      data: {
        active: false,
        endedAt: now,
        notes: [assignment.notes, reason || "Caretaker unlinked from apartment"]
          .filter(Boolean)
          .join("\n\n"),
      },
    });

    if (assignment.unitId) {
      await tx.lease.updateMany({
        where: {
          orgId,
          unitId: assignment.unitId,
          caretakerUserId: assignment.caretakerUserId,
          deletedAt: null,
          status: {
            in: [LeaseStatus.PENDING, LeaseStatus.ACTIVE],
          },
        },
        data: {
          caretakerUserId: null,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        orgId,
        actorUserId,
        action: "CARETAKER_ASSIGNMENT_UNLINKED",
        entityType: "CaretakerAssignment",
        entityId: assignment.id,
        metadata: {
          caretakerUserId: assignment.caretakerUserId,
          propertyId: assignment.propertyId,
          buildingId: assignment.buildingId,
          unitId: assignment.unitId,
          endedAt: now.toISOString(),
          reason: reason || null,
        },
      },
    });
  });

  revalidatePath("/staff/caretaker");
  revalidatePath(`/staff/caretaker/${membershipId}`);
}