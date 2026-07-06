import { prisma } from "@/lib/prisma";
import { buildCombinedBills } from "./helpers";
import {
  tenantInvoiceArgs,
  type TenantInvoicePageData,
  type TenantInvoiceResult,
} from "./types";

export async function getTenantInvoiceData(
  userId: string,
  orgId: string,
  fallbackName: string,
): Promise<TenantInvoicePageData> {
  const tenant: TenantInvoiceResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantInvoiceArgs,
  });

  const activeLease = tenant?.leases?.[0];
  const unit = activeLease?.unit;
  const bills = tenant ? buildCombinedBills(tenant) : [];

  const totalBilled = bills.reduce((sum, bill) => sum + bill.amountDue, 0);
  const totalBalance = bills.reduce((sum, bill) => sum + bill.balance, 0);

  const totalRent = bills
    .filter((bill) => bill.typeLabel === "Rent")
    .reduce((sum, bill) => sum + bill.amountDue, 0);

  const totalWater = bills
    .filter((bill) => bill.typeLabel === "Water Bill")
    .reduce((sum, bill) => sum + bill.amountDue, 0);

  const totalServiceCharge = bills
    .filter((bill) => bill.typeLabel === "Service Charge")
    .reduce((sum, bill) => sum + bill.amountDue, 0);

  const totalGarbage = bills
    .filter((bill) => bill.typeLabel === "Garbage")
    .reduce((sum, bill) => sum + bill.amountDue, 0);

  return {
    tenant,
    tenantName: tenant?.fullName ?? fallbackName,
    unit,
    bills,
    totalBilled,
    totalBalance,
    totalRent,
    totalWater,
    totalServiceCharge,
    totalGarbage,
  };
}