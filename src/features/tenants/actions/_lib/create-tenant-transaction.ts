import { hash } from "bcryptjs";
import { Prisma, TenantStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureTenantIdentity } from "@/lib/tenants/identity";
import { generateUniqueUsername } from "./credentials";

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
  generatedPassword: string;
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

    const duplicateUser = await tx.user.findFirst({
      where: {
        OR: [
          { phone: input.phone },
          ...(input.email ? [{ email: input.email }] : []),
        ],
      },
      select: {
        id: true,
      },
    });

    if (duplicateUser) {
      throw new Error(
        "A user account with the same phone or email already exists.",
      );
    }

    const username = await generateUniqueUsername(tx, input.fullName);
    const passwordHash = await hash(input.generatedPassword, 10);

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

    const tenant = await tx.tenant.create({
      data: {
        orgId: input.orgId,
        userId: user.id,
        fullName: input.fullName,
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

      await tx.lease.create({
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
      tenantName: tenant.fullName,
      username: user.username ?? username,
    };
  });
}