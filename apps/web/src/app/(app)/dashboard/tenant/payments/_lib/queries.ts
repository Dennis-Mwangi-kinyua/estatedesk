import { prisma } from "@/lib/prisma";
import { getTenantLedger } from "@/lib/ledger";
import {
  filterTenantPayments,
  getPaymentCategory,
} from "@/app/(app)/dashboard/tenant/payments/_lib/helpers";
import { getTenantTaxCharges } from "@/app/(app)/dashboard/tenant/payments/_lib/tax-charges";
import {
  tenantPaymentsArgs,
  type TenantPaymentsPageData,
  type TenantPaymentsResult,
} from "@/app/(app)/dashboard/tenant/payments/_lib/types";

export async function getTenantPaymentsData(
  userId: string,
  orgId: string,
): Promise<TenantPaymentsPageData | null> {
  const tenant: TenantPaymentsResult | null = await prisma.tenant.findFirst({
    where: {
      userId,
      orgId,
      deletedAt: null,
    },
    ...tenantPaymentsArgs,
  });

  if (!tenant) {
    return null;
  }

  const [tenantLedger, taxCharges] = await Promise.all([
    getTenantLedger(userId, orgId),
    getTenantTaxCharges(tenant.id, orgId),
  ]);
  const payments = tenant.payments ?? [];
  const filteredPayments = filterTenantPayments(payments);

  const totalPaid = filteredPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );

  const successfulPayments = filteredPayments.filter(
    (payment) => payment.gatewayStatus === "SUCCESS",
  );

  const pendingPayments = filteredPayments.filter(
    (payment) =>
      payment.gatewayStatus === "PENDING" ||
      payment.gatewayStatus === "INITIATED",
  );

  const verifiedPayments = filteredPayments.filter(
    (payment) => payment.verificationStatus === "VERIFIED",
  );

  const totalRentPaid = filteredPayments
    .filter((payment) => getPaymentCategory(payment) === "Rent")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const totalWaterPaid = filteredPayments
    .filter((payment) => getPaymentCategory(payment) === "Water Bill")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const totalServiceChargePaid = filteredPayments
    .filter((payment) => getPaymentCategory(payment) === "Service Charge")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const totalGarbagePaid = filteredPayments
    .filter((payment) => getPaymentCategory(payment) === "Garbage")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  return {
    tenant,
    tenantLedger,
    filteredPayments,
    totalPaid,
    successfulPayments,
    pendingPayments,
    verifiedPayments,
    totalRentPaid,
    totalWaterPaid,
    totalServiceChargePaid,
    totalGarbagePaid,
    latestPayment: filteredPayments[0] ?? null,
    activeLease: tenant.leases[0] ?? null,
    taxCharges,
  };
}