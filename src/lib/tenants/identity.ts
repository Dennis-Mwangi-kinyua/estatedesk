import { Prisma } from "@prisma/client";

type TenantIdentityInput = {
  tenantId?: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  nationalId?: string | null;
  kraPin?: string | null;
};

type RecordVacatedTenancyInput = {
  tenantId: string;
  leaseId: string;
  moveOutNoticeId?: string | null;
  actorUserId?: string | null;
  notes?: string | null;
};

function normalizeNullable(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildIdentityWhere(input: TenantIdentityInput): Prisma.TenantIdentityWhereInput {
  const conditions: Prisma.TenantIdentityWhereInput[] = [];
  const phone = normalizeNullable(input.phone);
  const email = normalizeNullable(input.email)?.toLowerCase() ?? null;
  const nationalId = normalizeNullable(input.nationalId);
  const kraPin = normalizeNullable(input.kraPin)?.toUpperCase() ?? null;

  if (phone) conditions.push({ primaryPhone: phone });
  if (email) conditions.push({ primaryEmail: email });
  if (nationalId) conditions.push({ nationalId });
  if (kraPin) conditions.push({ kraPin });

  return conditions.length > 0 ? { OR: conditions } : { id: "__missing__" };
}

export async function ensureTenantIdentity(
  tx: Prisma.TransactionClient,
  input: TenantIdentityInput,
) {
  const phone = normalizeNullable(input.phone);
  const email = normalizeNullable(input.email)?.toLowerCase() ?? null;
  const nationalId = normalizeNullable(input.nationalId);
  const kraPin = normalizeNullable(input.kraPin)?.toUpperCase() ?? null;

  const existing = await tx.tenantIdentity.findFirst({
    where: buildIdentityWhere(input),
    select: { id: true },
  });

  const identity = existing
    ? await tx.tenantIdentity.update({
        where: { id: existing.id },
        data: {
          displayName: input.fullName,
          primaryPhone: phone,
          primaryEmail: email,
          nationalId,
          kraPin,
        },
        select: { id: true },
      })
    : await tx.tenantIdentity.create({
        data: {
          displayName: input.fullName,
          primaryPhone: phone,
          primaryEmail: email,
          nationalId,
          kraPin,
        },
        select: { id: true },
      });

  if (input.tenantId) {
    await tx.tenant.update({
      where: { id: input.tenantId },
      data: { identityId: identity.id },
    });
  }

  return identity;
}

export async function recordVacatedTenancy(
  tx: Prisma.TransactionClient,
  input: RecordVacatedTenancyInput,
) {
  const lease = await tx.lease.findFirst({
    where: {
      id: input.leaseId,
      tenantId: input.tenantId,
      deletedAt: null,
    },
    include: {
      tenant: true,
      unit: {
        include: {
          building: true,
          property: true,
        },
      },
      moveOutNotices: {
        where: input.moveOutNoticeId ? { id: input.moveOutNoticeId } : undefined,
        orderBy: { moveOutDate: "desc" },
        take: 1,
      },
    },
  });

  if (!lease) {
    throw new Error("Lease could not be found for tenant history.");
  }

  const identity =
    lease.tenant.identityId
      ? { id: lease.tenant.identityId }
      : await ensureTenantIdentity(tx, {
          tenantId: lease.tenant.id,
          fullName: lease.tenant.fullName,
          phone: lease.tenant.phone,
          email: lease.tenant.email,
          nationalId: lease.tenant.nationalId,
          kraPin: lease.tenant.kraPin,
        });

  const notice = lease.moveOutNotices[0] ?? null;
  const moveOutDate = notice?.moveOutDate ?? lease.endDate ?? new Date();

  const paidPayments = await tx.payment.findMany({
    where: {
      orgId: lease.orgId,
      payerTenantId: lease.tenantId,
      OR: [{ gatewayStatus: "SUCCESS" }, { verificationStatus: "VERIFIED" }],
    },
    select: { amount: true },
  });

  const totalPaid = paidPayments.reduce(
    (total, payment) => total.add(payment.amount),
    new Prisma.Decimal(0),
  );

  const existingHistory = await tx.tenantHistoryRecord.findFirst({
    where: {
      tenantId: lease.tenantId,
      leaseId: lease.id,
      moveOutNoticeId: notice?.id ?? null,
    },
    select: { id: true },
  });

  const historyData = {
    orgId: lease.orgId,
    tenantId: lease.tenantId,
    identityId: identity.id,
    leaseId: lease.id,
    moveOutNoticeId: notice?.id ?? null,
    status: "VACATED" as const,
    propertyName: lease.unit.property.name,
    buildingName: lease.unit.building?.name ?? null,
    unitHouseNo: lease.unit.houseNo,
    leaseStartDate: lease.startDate,
    leaseEndDate: lease.endDate ?? moveOutDate,
    moveOutDate,
    monthlyRent: lease.monthlyRent,
    deposit: lease.deposit,
    paymentCount: paidPayments.length,
    totalPaid,
    notes: input.notes ?? notice?.notes ?? lease.notes,
    snapshot: {
      tenant: {
        fullName: lease.tenant.fullName,
        phone: lease.tenant.phone,
        email: lease.tenant.email,
        nationalId: lease.tenant.nationalId,
        kraPin: lease.tenant.kraPin,
        status: lease.tenant.status,
      },
      unit: {
        propertyName: lease.unit.property.name,
        buildingName: lease.unit.building?.name ?? null,
        houseNo: lease.unit.houseNo,
      },
      lease: {
        startDate: lease.startDate.toISOString(),
        endDate: (lease.endDate ?? moveOutDate).toISOString(),
        monthlyRent: lease.monthlyRent.toString(),
        deposit: lease.deposit?.toString() ?? null,
      },
      moveOutNotice: notice
        ? {
            id: notice.id,
            status: notice.status,
            noticeDate: notice.noticeDate.toISOString(),
            moveOutDate: notice.moveOutDate.toISOString(),
          }
        : null,
    },
  } satisfies Prisma.TenantHistoryRecordUncheckedUpdateInput &
    Prisma.TenantHistoryRecordUncheckedCreateInput;

  const history = existingHistory
    ? await tx.tenantHistoryRecord.update({
        where: { id: existingHistory.id },
        data: historyData,
        select: { id: true },
      })
    : await tx.tenantHistoryRecord.create({
        data: historyData,
        select: { id: true },
      });

  await tx.lease.update({
    where: { id: lease.id },
    data: {
      status: "TERMINATED",
      endDate: lease.endDate ?? moveOutDate,
    },
  });

  await tx.unit.update({
    where: { id: lease.unitId },
    data: {
      status: "VACANT",
      vacantSince: moveOutDate,
    },
  });

  await tx.tenant.update({
    where: { id: lease.tenantId },
    data: {
      status: lease.tenant.status === "BLACKLISTED" ? "BLACKLISTED" : "INACTIVE",
      archivedAt: lease.tenant.archivedAt ?? moveOutDate,
      identityId: identity.id,
    },
  });

  if (input.actorUserId) {
    await tx.tenantActionLog.create({
      data: {
        orgId: lease.orgId,
        tenantId: lease.tenantId,
        leaseId: lease.id,
        unitId: lease.unitId,
        actorUserId: input.actorUserId,
        action: "ARCHIVED",
        reason: "Tenant vacated",
        notes: input.notes ?? "Tenant record archived after move-out.",
        metadata: {
          historyRecordId: history.id,
          moveOutNoticeId: notice?.id ?? null,
          moveOutDate: moveOutDate.toISOString(),
        },
      },
    });
  }

  return history;
}
