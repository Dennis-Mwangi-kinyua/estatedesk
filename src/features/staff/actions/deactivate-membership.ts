"use server";

import { OrgRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { requireOrgPermission } from "@/lib/permissions/guards";

const STAFF_ROLES = ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT", "CARETAKER"] as const;

function parseEndDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return new Date();

  const parsed = new Date(`${trimmed}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export async function deactivateMembershipAction(formData: FormData) {
  await requireOrgPermission("org.users.delete");
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    throw new Error("No active organisation found.");
  }

  const membershipId = String(formData.get("membershipId") ?? "").trim();
  const exitReason = String(formData.get("exitReason") ?? "").trim();
  const notes = String(formData.get("deactivationNotes") ?? "").trim();
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  const endedAt = parseEndDate(String(formData.get("employmentEndedAt") ?? ""));
  const disableLogin = String(formData.get("disableLogin") ?? "") === "on";

  if (!membershipId) {
    throw new Error("Membership id is required.");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      orgId: session.activeOrgId,
      role: {
        in: [...STAFF_ROLES],
      },
      employmentEndedAt: null,
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
    throw new Error("Active staff membership not found.");
  }

  const expectedConfirmation = membership.user.fullName.trim() || "DEACTIVATE";

  if (confirmation !== expectedConfirmation) {
    throw new Error("Confirmation did not match this staff member's name.");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.membership.update({
      where: { id: membership.id },
      data: {
        employmentEndedAt: endedAt,
        employmentExitReason: exitReason || "Employment ended",
        deactivatedAt: now,
        deactivatedByUserId: session.userId,
        deactivationNotes: notes || null,
      },
    });

    if (membership.role === OrgRole.CARETAKER) {
      await tx.caretakerAssignment.updateMany({
        where: {
          orgId: membership.orgId,
          caretakerUserId: membership.userId,
          active: true,
        },
        data: {
          active: false,
          endedAt,
        },
      });

      await tx.lease.updateMany({
        where: {
          orgId: membership.orgId,
          caretakerUserId: membership.userId,
          deletedAt: null,
        },
        data: {
          caretakerUserId: null,
        },
      });
    }

    await tx.userSession.deleteMany({
      where: {
        userId: membership.userId,
        activeMembershipId: membership.id,
      },
    });

    const remainingActiveMemberships = await tx.membership.count({
      where: {
        userId: membership.userId,
        employmentEndedAt: null,
      },
    });

    if (disableLogin || remainingActiveMemberships === 0) {
      await tx.user.update({
        where: { id: membership.userId },
        data: {
          status: "DISABLED",
        },
      });

      await tx.userSession.deleteMany({
        where: {
          userId: membership.userId,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        orgId: membership.orgId,
        actorUserId: session.userId,
        action: "STAFF_MEMBERSHIP_DEACTIVATED",
        entityType: "Membership",
        entityId: membership.id,
        metadata: {
          staffUserId: membership.userId,
          staffName: membership.user.fullName,
          role: membership.role,
          employmentEndedAt: endedAt.toISOString(),
          exitReason: exitReason || null,
          disableLogin,
        },
      },
    });
  });

  revalidatePath("/staff");
  revalidatePath("/staff/previous");
  revalidatePath(`/staff/${membership.role.toLowerCase()}`);
  redirect("/staff/previous");
}

export async function reactivateMembershipAction(formData: FormData) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    throw new Error("No active organisation found.");
  }

  const membershipId = String(formData.get("membershipId") ?? "").trim();

  if (!membershipId) {
    throw new Error("Membership id is required.");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      orgId: session.activeOrgId,
      role: {
        in: [...STAFF_ROLES],
      },
      employmentEndedAt: {
        not: null,
      },
      user: {
        deletedAt: null,
      },
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
    throw new Error("Previous employee record not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.membership.update({
      where: { id: membership.id },
      data: {
        employmentEndedAt: null,
        employmentExitReason: null,
        deactivatedAt: null,
        deactivatedByUserId: null,
        deactivationNotes: null,
      },
    });

    await tx.user.update({
      where: { id: membership.userId },
      data: {
        status: "ACTIVE",
      },
    });

    await tx.auditLog.create({
      data: {
        orgId: membership.orgId,
        actorUserId: session.userId,
        action: "STAFF_MEMBERSHIP_REACTIVATED",
        entityType: "Membership",
        entityId: membership.id,
        metadata: {
          staffUserId: membership.userId,
          staffName: membership.user.fullName,
          role: membership.role,
        },
      },
    });
  });

  revalidatePath("/staff");
  revalidatePath("/staff/previous");
  revalidatePath(`/staff/${membership.role.toLowerCase()}`);
  redirect(`/staff/${membership.role.toLowerCase()}/${membership.id}`);
}
