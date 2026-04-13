import Link from "next/link";
import type { ReactNode } from "react";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  GatewayStatus,
  VerificationStatus,
  PaymentMethod,
  PaymentTargetType,
  ChargeType,
} from "@prisma/client";
import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  Droplets,
  ReceiptText,
  Trash2,
  Wallet,
  Wrench,
} from "lucide-react";

const tenantPaymentsArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    payments: {
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
      include: {
        receipt: true,
        rentCharge: {
          include: {
            lease: {
              include: {
                unit: {
                  include: {
                    building: true,
                    property: true,
                  },
                },
              },
            },
          },
        },
        waterBill: {
          include: {
            unit: {
              include: {
                building: true,
                property: true,
              },
            },
          },
        },
      },
    },
  },
});

type TenantPaymentsResult = Prisma.TenantGetPayload<typeof tenantPaymentsArgs>;
type PaymentItem = TenantPaymentsResult["payments"][number];

function formatMoney(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return "N/A";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getPaymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case "MPESA_STK":
      return "M-Pesa STK";
    case "BANK":
      return "Bank";
    case "CASH":
      return "Cash";
    default:
      return method;
  }
}

function getChargeTypeLabel(type: ChargeType | null | undefined) {
  switch (type) {
    case "RENT":
      return "Rent";
    case "WATER":
      return "Water Bill";
    case "SERVICE_CHARGE":
      return "Service Charge";
    case "OTHER":
      return "Garbage";
    default:
      return null;
  }
}

function getTargetLabel(targetType: PaymentTargetType) {
  switch (targetType) {
    case "RENT":
      return "Rent";
    case "WATER":
      return "Water Bill";
    case "DEPOSIT":
      return "Deposit";
    case "OTHER":
      return "Other";
    default:
      return targetType;
  }
}

function getGatewayClasses(status: GatewayStatus) {
  switch (status) {
    case "SUCCESS":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING":
    case "INITIATED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "FAILED":
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function getVerificationClasses(status: VerificationStatus) {
  switch (status) {
    case "VERIFIED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "NOT_REQUIRED":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function getPaymentTitle(payment: PaymentItem) {
  if (payment.rentCharge) {
    const chargeLabel = getChargeTypeLabel(payment.rentCharge.chargeType);

    if (chargeLabel) {
      return `${chargeLabel} • ${payment.rentCharge.period}`;
    }

    return `Charge • ${payment.rentCharge.period}`;
  }

  if (payment.waterBill) {
    return `Water Bill • ${payment.waterBill.period}`;
  }

  return getTargetLabel(payment.targetType);
}

function getPaymentSubtitle(payment: PaymentItem) {
  if (payment.rentCharge?.lease?.unit) {
    const unit = payment.rentCharge.lease.unit;
    return `${unit.property.name} • Unit ${unit.houseNo}`;
  }

  if (payment.waterBill?.unit) {
    const unit = payment.waterBill.unit;
    return `${unit.property.name} • Unit ${unit.houseNo}`;
  }

  return payment.reference || "Tenant payment";
}

function getPaymentCategory(payment: PaymentItem) {
  if (payment.rentCharge?.chargeType) {
    return getChargeTypeLabel(payment.rentCharge.chargeType) ?? "Other";
  }

  if (payment.waterBill) {
    return "Water Bill";
  }

  return getTargetLabel(payment.targetType);
}

function getReceiptHref(payment: PaymentItem) {
  if (payment.receipt?.pdfUrl) return payment.receipt.pdfUrl;
  if (payment.receipt?.id) return `/tenant/receipts/${payment.receipt.id}`;
  return null;
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        {children}
      </div>
    </div>
  );
}

function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-black/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-[#fafafa] p-4">
      <div className="flex items-center gap-2 text-neutral-500">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
          {icon}
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em]">
          {label}
        </p>
      </div>
      <p className="mt-3 text-[15px] font-semibold text-neutral-950">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <SurfaceCard className="p-8 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
        My Payments
      </h1>
      <p className="mt-2 text-sm text-neutral-500">
        No payment records found for your account.
      </p>
    </SurfaceCard>
  );
}

export default async function TenantPaymentsPage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const tenant: TenantPaymentsResult | null = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    ...tenantPaymentsArgs,
  });

  const payments = tenant?.payments ?? [];

  if (!tenant || payments.length === 0) {
    return (
      <PageShell>
        <EmptyState />
      </PageShell>
    );
  }

  const filteredPayments = payments.filter((payment) => {
    if (payment.waterBill) return true;

    if (payment.rentCharge?.chargeType) {
      return ["RENT", "SERVICE_CHARGE", "OTHER", "WATER"].includes(
        payment.rentCharge.chargeType
      );
    }

    return payment.targetType === "RENT" || payment.targetType === "WATER" || payment.targetType === "OTHER";
  });

  const totalPaid = filteredPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const successfulPayments = filteredPayments.filter(
    (payment) => payment.gatewayStatus === "SUCCESS"
  );

  const pendingPayments = filteredPayments.filter(
    (payment) =>
      payment.gatewayStatus === "PENDING" ||
      payment.gatewayStatus === "INITIATED"
  );

  const verifiedPayments = filteredPayments.filter(
    (payment) => payment.verificationStatus === "VERIFIED"
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

  const latestPayment = filteredPayments[0] ?? null;

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <SurfaceCard className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Payments Overview
              </p>
              <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
                My Payments
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                Track your recent rent, water, service charge, and garbage payments in one place.
              </p>
            </div>

            {latestPayment ? (
              <div className="rounded-[24px] bg-[#f7f7fa] px-4 py-4 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Latest Payment
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-950">
                  {formatMoney(latestPayment.amount)}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {getPaymentTitle(latestPayment)} •{" "}
                  {formatDate(latestPayment.paidAt || latestPayment.createdAt)}
                </p>
              </div>
            ) : null}
          </div>
        </SurfaceCard>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
          <StatCard
            icon={<Wallet className="h-4 w-4" />}
            label="Total Paid"
            value={formatMoney(totalPaid)}
          />
          <StatCard
            icon={<BadgeCheck className="h-4 w-4" />}
            label="Successful"
            value={successfulPayments.length}
          />
          <StatCard
            icon={<Clock3 className="h-4 w-4" />}
            label="Pending"
            value={pendingPayments.length}
          />
          <StatCard
            icon={<ReceiptText className="h-4 w-4" />}
            label="Verified"
            value={verifiedPayments.length}
          />
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
          <StatCard
            icon={<Wallet className="h-4 w-4" />}
            label="Rent Paid"
            value={formatMoney(totalRentPaid)}
          />
          <StatCard
            icon={<Droplets className="h-4 w-4" />}
            label="Water Paid"
            value={formatMoney(totalWaterPaid)}
          />
          <StatCard
            icon={<Wrench className="h-4 w-4" />}
            label="Service Charge"
            value={formatMoney(totalServiceChargePaid)}
          />
          <StatCard
            icon={<Trash2 className="h-4 w-4" />}
            label="Garbage"
            value={formatMoney(totalGarbagePaid)}
          />
        </section>

        <SurfaceCard className="p-4 sm:p-6 xl:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
                Recent Payments
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Last {filteredPayments.length} payment records
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 lg:hidden">
            {filteredPayments.map((payment) => {
              const receiptHref = getReceiptHref(payment);

              return (
                <div
                  key={payment.id}
                  className="rounded-[22px] border border-black/5 bg-[#fafafa] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-950">
                        {getPaymentTitle(payment)}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {getPaymentSubtitle(payment)}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-neutral-950">
                      {formatMoney(payment.amount)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getGatewayClasses(
                        payment.gatewayStatus
                      )}`}
                    >
                      {payment.gatewayStatus}
                    </span>

                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getVerificationClasses(
                        payment.verificationStatus
                      )}`}
                    >
                      {payment.verificationStatus}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-[16px] bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Method
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        {getPaymentMethodLabel(payment.method)}
                      </p>
                    </div>

                    <div className="rounded-[16px] bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Date
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-[16px] bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Reference
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-neutral-950">
                        {payment.reference || payment.externalReference || "—"}
                      </p>
                    </div>

                    <div className="rounded-[16px] bg-white px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Category
                      </p>
                      <p className="mt-1 text-sm font-semibold text-neutral-950">
                        {getPaymentCategory(payment)}
                      </p>
                    </div>
                  </div>

                  {receiptHref ? (
                    <div className="mt-3">
                      <Link
                        href={receiptHref}
                        className="inline-flex items-center gap-2 rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm font-medium text-neutral-800"
                      >
                        <ReceiptText className="h-4 w-4" />
                        Download Receipt
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-[24px] border border-black/5 bg-white lg:block">
            <table className="min-w-full text-sm">
              <thead className="border-b border-neutral-200 bg-[#fcfcfd]">
                <tr className="text-left text-neutral-500">
                  <th className="px-5 py-4 font-medium">Payment</th>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Method</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Gateway</th>
                  <th className="px-5 py-4 font-medium">Verification</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const receiptHref = getReceiptHref(payment);

                  return (
                    <tr
                      key={payment.id}
                      className="border-b border-neutral-100 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-neutral-950">
                            {getPaymentTitle(payment)}
                          </p>
                          <p className="mt-1 text-neutral-500">
                            {getPaymentSubtitle(payment)}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-neutral-600">
                        {getPaymentCategory(payment)}
                      </td>

                      <td className="px-5 py-4 text-neutral-600">
                        {getPaymentMethodLabel(payment.method)}
                      </td>

                      <td className="px-5 py-4 font-semibold text-neutral-950">
                        {formatMoney(payment.amount)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getGatewayClasses(
                            payment.gatewayStatus
                          )}`}
                        >
                          {payment.gatewayStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getVerificationClasses(
                            payment.verificationStatus
                          )}`}
                        >
                          {payment.verificationStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-neutral-600">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        {receiptHref ? (
                          <Link
                            href={receiptHref}
                            className="inline-flex items-center gap-1 font-medium text-neutral-900 hover:text-neutral-700"
                          >
                            Download
                            <ArrowUpRight className="h-4 w-4" />
                          </Link>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}