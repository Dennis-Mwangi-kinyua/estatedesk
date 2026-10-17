import { hash } from "bcryptjs";
import { Prisma, TenantStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureTenantIdentity } from "@/lib/tenants/identity";
import { createInitialLeaseCharges } from "@/lib/billing/initial-lease-charges";
import { OPENING_ARREARS_PREFIX, type OpeningArrearsEntry } from "@/lib/tenants/opening-arrears";
import { postRentChargeAccrual } from "@/lib/accounting/billing";
import { normalizeUsername } from "./credentials";

type CreateTenantTransactionInput = {
  orgId: string;
  fullName: string;
  phone: string;
  email: string | null;
  nationalId: string | null;
  kraPin: string | null;
  notes: string | null;
  statusRaw: TenantStatus;
  nextOfKinName: string;
  nextOfKinRelationship: string;
  nextOfKinPhone: string;
  nextOfKinEmail: string | null;
  unitId: string | null;
  leaseStartDate: Date;
  dueDay: number | null;
  monthlyRent: Prisma.Decimal | null;
  deposit: Prisma.Decimal | null;
  username: string;
  password: string;
  existingLease?: boolean;
  openingArrears?: OpeningArrearsEntry[];
  actorUserId?: string;
};

export async function executeCreateTenantTransaction(
  input: CreateTenantTransactionInput,
) {
  return prisma.$transaction(async (tx) => {
    const duplicateTenant = await tx.tenant.findFirst({
      where: {
        orgId: input.orgId,
        OR: [
          { phone: input.phone },
          ...(input.email ? [{ email: input.email }] : []),
        ],
      },
      select: {
        id: true,
      },
    });

    if (duplicateTenant) {
      throw new Error(
        "A tenant with the same phone or email already exists in this organisation.",
      );
    }

    const username = normalizeUsername(input.username);

    const duplicateUser = await tx.user.findFirst({
      where: {
        OR: [
          { username },
          { phone: input.phone },
          ...(input.email ? [{ email: input.email }] : []),
        ],
      },
      select: {
        id: true,
        username: true,
        phone: true,
        email: true,
      },
    });

    if (duplicateUser) {
      if (duplicateUser.username === username) {
        throw new Error(
          "This username is already taken. Please choose a different username.",
        );
      }

      throw new Error(
        "A user account with the same phone or email already exists.",
      );
    }

    const passwordHash = await hash(input.password, 10);

    const user = await tx.user.create({
      data: {
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        username,
        passwordHash,
        mustChangePassword: true,
        status: "ACTIVE",
        platformRole: "USER",
      },
      select: {
        id: true,
        username: true,
      },
    });

    await tx.membership.create({
      data: {
        orgId: input.orgId,
        userId: user.id,
        role: "TENANT",
        scopeType: "ORG",
        scopeId: "ORG_SCOPE",
      },
    });

    const { allocateTenantSlug } = await import("@/lib/tenants/slug");
    const tenantSlug = await allocateTenantSlug(tx, input.orgId, input.fullName);

    const tenant = await tx.tenant.create({
      data: {
        orgId: input.orgId,
        userId: user.id,
        fullName: input.fullName,
        slug: tenantSlug,
        phone: input.phone,
        email: input.email,
        nationalId: input.nationalId,
        kraPin: input.kraPin,
        notes: input.notes,
        status: input.statusRaw,
        nextOfKin: {
          create: {
            name: input.nextOfKinName,
            relationship: input.nextOfKinRelationship,
            phone: input.nextOfKinPhone,
            email: input.nextOfKinEmail,
          },
        },
      },
      select: {
        id: true,
        slug: true,
        fullName: true,
      },
    });

    await ensureTenantIdentity(tx, {
      tenantId: tenant.id,
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      nationalId: input.nationalId,
      kraPin: input.kraPin,
    });

    let allocation: { property: string; unit: string; currency: string; monthlyRent: string; deposit: string | null; startDate: string; dueDay: number } | null = null;
    if (input.unitId) {
      const unit = await tx.unit.findFirst({
        where: {
          id: input.unitId,
          deletedAt: null,
          isActive: true,
          status: "VACANT",
          property: {
            orgId: input.orgId,
            deletedAt: null,
          },
        },
        select: {
          id: true,
          houseNo: true,
          property: { select: { name: true, org: { select: { currencyCode: true } } } },
          rentAmount: true,
          depositAmount: true,
        },
      });

      if (!unit) {
        throw new Error(
          "The selected unit is no longer available for mapping.",
        );
      }

      const effectiveMonthlyRent = input.monthlyRent ?? unit.rentAmount;
      const effectiveDeposit = input.deposit ?? unit.depositAmount ?? null;

      const lease = await tx.lease.create({
        data: {
          orgId: input.orgId,
          unitId: unit.id,
          tenantId: tenant.id,
          startDate: input.leaseStartDate,
          dueDay: input.dueDay ?? 5,
          monthlyRent: effectiveMonthlyRent,
          deposit: effectiveDeposit,
          status: "ACTIVE",
        },
      });

      allocation = { property: unit.property.name, unit: unit.houseNo, currency: unit.property.org.currencyCode, monthlyRent: lease.monthlyRent.toString(), deposit: lease.deposit?.toString() ?? null, startDate: lease.startDate.toISOString(), dueDay: lease.dueDay ?? 5 };
      if (!input.existingLease) await createInitialLeaseCharges(tx, lease);
      for (const entry of input.openingArrears ?? []) {
        const amount = new Prisma.Decimal(entry.amount);
        const [year, month] = entry.period.split("-").map(Number);
        const day = Math.min(lease.dueDay ?? 5, new Date(Date.UTC(year, month, 0)).getUTCDate());
        const charge = await tx.rentCharge.create({ data: {
          orgId: input.orgId, leaseId: lease.id, period: entry.period, chargeType: "OTHER",
          description: `${OPENING_ARREARS_PREFIX}${entry.period} (imported unpaid balance)`,
          amountDue: amount, amountPaid: 0, balance: amount,
          dueDate: new Date(Date.UTC(year, month - 1, day)), status: "UNPAID",
        } });
        await postRentChargeAccrual(tx, charge.id, input.actorUserId);
      }
      if (input.openingArrears?.length && input.actorUserId) await tx.auditLog.create({ data: {
        orgId: input.orgId, actorUserId: input.actorUserId, action: "TENANT_OPENING_ARREARS_IMPORTED",
        entityType: "Tenant", entityId: tenant.id,
        metadata: { leaseId: lease.id, entries: input.openingArrears,
          total: input.openingArrears.reduce((sum, entry) => sum.add(entry.amount), new Prisma.Decimal(0)).toFixed(2) },
      } });

      await tx.unit.update({
        where: {
          id: unit.id,
        },
        data: {
          status: "OCCUPIED",
          vacantSince: null,
        },
      });
    }

    return {
      allocation,
      tenantName: tenant.fullName,
      username: user.username ?? username,
    };
  }, { timeout: 15_000 });
}
