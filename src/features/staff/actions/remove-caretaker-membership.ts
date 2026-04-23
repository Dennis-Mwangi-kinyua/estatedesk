// src/features/staff/actions/remove-caretaker-membership.ts
"use server";

import { OrgRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

function getActorUserId(session: unknown) {
  return (session as { userId?: string; user?: { id?: string } }).userId
    ?? (session as { user?: { id?: string } }).user?.id
    ?? null;
}

export async function removeCaretakerMembershipAction(formData: FormData) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    throw new Error("No active organisation found.");
  }

  const orgId = session.activeOrgId;

  const actorUserId = getActorUserId(session);
  if (!actorUserId) {
    throw new Error("Could not resolve the current user.");
  }

  const membershipId = String(formData.get("membershipId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!membershipId) {
    throw new Error("Membership id is required.");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      orgId,
      role: OrgRole.CARETAKER,
    },
    select: {
      id: true,
      orgId: true,
      userId: true,
      role: true,
      user: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (!membership) {
    throw new Error("Caretaker membership not found.");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.caretakerAssignment.updateMany({
      where: {
        orgId,
        caretakerUserId: membership.userId,
        active: true,
      },
      data: {
        active: false,
        endedAt: now,
      },
    });

    await tx.lease.updateMany({
      where: {
        orgId,
        caretakerUserId: membership.userId,
        deletedAt: null,
      },
      data: {
        caretakerUserId: null,
      },
    });

    await tx.membership.delete({
      where: {
        id: membership.id,
      },
    });

    await tx.auditLog.create({
      data: {
        orgId,
        actorUserId,
        action: "CARETAKER_MEMBERSHIP_REMOVED",
        entityType: "Membership",
        entityId: membership.id,
        metadata: {
          role: membership.role,
          caretakerUserId: membership.userId,
          caretakerName: membership.user.fullName,
          removedAt: now.toISOString(),
          reason: reason || null,
        },
      },
    });
  });

  revalidatePath("/staff");
  revalidatePath("/staff/caretaker");
}