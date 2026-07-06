"use server";

import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { getCurrentPeriod } from "@/lib/ledger";
import { buildPaymentReference } from "./reference";
import type { TenantPaymentCheckoutSummary } from "./types";

export async function getTenantPaymentCheckoutSummary({
  source,
  id,
}: {
  source: string | null;
  id: string | null;
}): Promise<TenantPaymentCheckoutSummary | null> {
  if (!source || !id) return null;

  const session = await requireTenantAccess();

  if (!session.userId || !session.activeOrgId) {
    throw new Error("Missing tenant session context.");
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant profile not found.");
  }

  if (source === "rent_charge") {
    const charge = await prisma.rentCharge.findFirst({
      where: {
        id,
        orgId: session.activeOrgId,
        lease: {
          tenantId: tenant.id,
          deletedAt: null,
        },
      },
      select: {
        period: true,
        chargeType: true,
        balance: true,
        amountDue: true,
        lease: {
          select: {
            unit: {
              select: {
                houseNo: true,
                property: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!charge) return null;

    const unitLabel = charge.lease.unit.houseNo;
    return {
      friendlyReference: buildPaymentReference({
        source,
        period: charge.period,
        unitLabel,
      }),
      description: `${charge.chargeType.toLowerCase().replaceAll("_", " ")} for ${charge.period}`,
      propertyName: charge.lease.unit.property.name,
      unitLabel,
      amount: Number(charge.balance ?? charge.amountDue),
    };
  }

  if (source === "advance_rent") {
    const lease = await prisma.lease.findFirst({
      where: {
        id,
        orgId: session.activeOrgId,
        tenantId: tenant.id,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: {
        unit: {
          select: {
            houseNo: true,
            property: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!lease) return null;

    const unitLabel = lease.unit.houseNo;
    return {
      friendlyReference: buildPaymentReference({
        source,
        period: getCurrentPeriod(),
        unitLabel,
      }),
      description: `Advance rent from ${getCurrentPeriod()}`,
      propertyName: lease.unit.property.name,
      unitLabel,
      amount: null,
    };
  }

  if (source === "water_bill") {
    const bill = await prisma.waterBill.findFirst({
      where: {
        id,
        orgId: session.activeOrgId,
        tenantId: tenant.id,
      },
      select: {
        period: true,
        total: true,
        unit: {
          select: {
            houseNo: true,
            property: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!bill) return null;

    const unitLabel = bill.unit.houseNo;
    return {
      friendlyReference: buildPaymentReference({
        source,
        period: bill.period,
        unitLabel,
      }),
      description: `Water bill for ${bill.period}`,
      propertyName: bill.unit.property.name,
      unitLabel,
      amount: Number(bill.total),
    };
  }

  return null;
}