import { buildTenantInvoiceBills } from "@/lib/billing/tenant-invoice-bills";
import { prisma } from "@/lib/prisma";
import { retryTransientDatabaseOperation } from "@/lib/db/retry";
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
  const tenant: TenantInvoiceResult | null = await retryTransientDatabaseOperation(
    () =>
      prisma.tenant.findFirst({
        where: {
          userId,
          orgId,
          deletedAt: null,
        },
        ...tenantInvoiceArgs,
      }),
    { label: "get-tenant-invoice-data" },
  );

  const activeLease = tenant?.leases?.[0];
  const unit = activeLease?.unit;
  const bills = tenant
    ? await buildTenantInvoiceBills({
        db: prisma,
        orgId,
        tenantId: tenant.id,
        tenant,
      })
    : [];

  const totalBilled = bills.reduce((sum, bill) => sum + bill.amountDue, 0);
  const totalBalance = bills.reduce((sum, bill) => sum + bill.balance, 0);

  const totalRent = bills.reduce((sum, bill) => {
    if (bill.lines?.length) {
      return (
        sum +
        bill.lines
          .filter((line) => line.kind === "RENT")
          .reduce((lineSum, line) => lineSum + line.amountDue, 0)
      );
    }
    return bill.typeLabel === "Rent" ? sum + bill.amountDue : sum;
  }, 0);

  const totalWater = bills.reduce((sum, bill) => {
    if (bill.lines?.length) {
      return (
        sum +
        bill.lines
          .filter((line) => line.kind === "WATER")
          .reduce((lineSum, line) => lineSum + line.amountDue, 0)
      );
    }
    return bill.typeLabel === "Water Bill" ? sum + bill.amountDue : sum;
  }, 0);

  const totalServiceCharge = bills
    .filter((bill) => bill.typeLabel === "Service Charge")
    .reduce((sum, bill) => sum + bill.amountDue, 0);

  const totalGarbage = bills
    .filter((bill) => bill.typeLabel === "Garbage")
    .reduce((sum, bill) => sum + bill.amountDue, 0);

  return {
    tenant,
    tenantName: tenant?.fullName ?? fallbackName,
    organizationName: tenant?.org?.name ?? "Organisation",
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