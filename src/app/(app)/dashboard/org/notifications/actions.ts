"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

async function requireOrgReviewer() {
  const session = await requireUserSession();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId ?? undefined,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          currencyCode: true,
        },
      },
    },
  });

  if (!membership) {
    throw new Error("Unauthorized");
  }

  return {
    session,
    membership,
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function approveMeterReading(formData: FormData) {
  const { session, membership } = await requireOrgReviewer();

  const readingId = String(formData.get("readingId") ?? "");

  if (!readingId) {
    throw new Error("Missing meter reading id");
  }

  const reading = await prisma.meterReading.findFirst({
    where: {
      id: readingId,
      status: "SUBMITTED",
      unit: {
        property: {
          orgId: membership.orgId,
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      unitId: true,
      period: true,
      prevReading: true,
      currentReading: true,
      unitsUsed: true,
      submittedByUserId: true,
      unit: {
        select: {
          id: true,
          houseNo: true,
          property: {
            select: {
              id: true,
              name: true,
              waterRatePerUnit: true,
              waterFixedCharge: true,
            },
          },
        },
      },
    },
  });

  if (!reading) {
    throw new Error("Submitted meter reading not found");
  }

  const activeLease = await prisma.lease.findFirst({
    where: {
      orgId: membership.orgId,
      unitId: reading.unitId,
      deletedAt: null,
      status: "ACTIVE",
    },
    select: {
      id: true,
      tenantId: true,
      tenant: {
        select: {
          id: true,
          fullName: true,
          userId: true,
        },
      },
    },
  });

  if (!activeLease) {
    throw new Error("Cannot approve reading without an active tenant lease for this unit");
  }

  const ratePerUnit = Number(reading.unit.property.waterRatePerUnit ?? 0);
  const fixedCharge = Number(reading.unit.property.waterFixedCharge ?? 0);
  const total = reading.unitsUsed * ratePerUnit + fixedCharge;
  const dueDate = addDays(new Date(), 7);

  await prisma.$transaction(async (tx) => {
    await tx.meterReading.update({
      where: {
        id: reading.id,
      },
      data: {
        status: "APPROVED",
        approvedByUserId: session.userId,
        approvedAt: new Date(),
        rejectionReason: null,
      },
    });

    await tx.waterBill.upsert({
      where: {
        unitId_period: {
          unitId: reading.unitId,
          period: reading.period,
        },
      },
      update: {
        tenantId: activeLease.tenantId,
        unitsUsed: reading.unitsUsed,
        ratePerUnit,
        fixedCharge,
        total,
        dueDate,
        status: "ISSUED",
        notes: `Generated from approved meter reading for ${reading.unit.property.name} / Unit ${reading.unit.houseNo}.`,
      },
      create: {
        orgId: membership.orgId,
        unitId: reading.unitId,
        tenantId: activeLease.tenantId,
        period: reading.period,
        unitsUsed: reading.unitsUsed,
        ratePerUnit,
        fixedCharge,
        total,
        dueDate,
        status: "ISSUED",
        notes: `Generated from approved meter reading for ${reading.unit.property.name} / Unit ${reading.unit.houseNo}.`,
      },
    });

    await tx.notification.create({
      data: {
        orgId: membership.orgId,
        tenantId: activeLease.tenantId,
        userId: activeLease.tenant.userId ?? undefined,
        channel: "IN_APP",
        type: "WATER_BILL_ISSUED",
        title: "Water bill issued",
        message: `Your water bill for ${reading.period} has been issued for ${reading.unit.property.name} / Unit ${reading.unit.houseNo}.`,
        status: "QUEUED",
      },
    });

    await tx.notification.create({
      data: {
        orgId: membership.orgId,
        userId: reading.submittedByUserId,
        channel: "IN_APP",
        type: "GENERAL",
        title: "Meter reading approved",
        message: `The ${reading.period} water reading for ${reading.unit.property.name} / Unit ${reading.unit.houseNo} was approved and the tenant bill has been issued.`,
        status: "QUEUED",
      },
    });
  });

  revalidatePath("/dashboard/org");
  revalidatePath("/dashboard/org/notifications");
}

export async function rejectMeterReading(formData: FormData) {
  const { session, membership } = await requireOrgReviewer();

  const readingId = String(formData.get("readingId") ?? "");
  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();

  if (!readingId) {
    throw new Error("Missing meter reading id");
  }

  if (!rejectionReason) {
    throw new Error("Rejection reason is required");
  }

  const reading = await prisma.meterReading.findFirst({
    where: {
      id: readingId,
      status: "SUBMITTED",
      unit: {
        property: {
          orgId: membership.orgId,
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      period: true,
      submittedByUserId: true,
      unit: {
        select: {
          houseNo: true,
          property: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!reading) {
    throw new Error("Submitted meter reading not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.meterReading.update({
      where: {
        id: reading.id,
      },
      data: {
        status: "REJECTED",
        approvedByUserId: session.userId,
        approvedAt: null,
        rejectionReason,
      },
    });

    await tx.notification.create({
      data: {
        orgId: membership.orgId,
        userId: reading.submittedByUserId,
        channel: "IN_APP",
        type: "GENERAL",
        title: "Meter reading rejected",
        message: `The ${reading.period} water reading for ${reading.unit.property.name} / Unit ${reading.unit.houseNo} was rejected. Reason: ${rejectionReason}`,
        status: "QUEUED",
      },
    });
  });

  revalidatePath("/dashboard/org");
  revalidatePath("/dashboard/org/notifications");
}