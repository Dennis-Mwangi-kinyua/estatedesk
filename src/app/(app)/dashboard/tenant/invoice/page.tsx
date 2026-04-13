import Link from "next/link";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  ChargeStatus,
  ChargeType,
  BillStatus,
  GatewayStatus,
  VerificationStatus,
} from "@prisma/client";

const tenantInvoiceArgs = Prisma.validator<Prisma.TenantDefaultArgs>()({
  include: {
    leases: {
      where: {
        deletedAt: null,
        status: "ACTIVE",
      },
      orderBy: {
        startDate: "desc",
      },
      take: 1,
      include: {
        unit: {
          include: {
            building: true,
            property: true,
          },
        },
        rentCharges: {
          orderBy: {
            dueDate: "desc",
          },
          take: 24,
          include: {
            payments: {
              orderBy: {
                createdAt: "desc",
              },
              include: {
                receipt: true,
              },
            },
          },
        },
      },
    },
    waterBills: {
      orderBy: {
        dueDate: "desc",
      },
      take: 24,
      include: {
        payments: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            receipt: true,
          },
        },
      },
    },
  },
});

type TenantInvoiceResult = Prisma.TenantGetPayload<typeof tenantInvoiceArgs>;

type CombinedBill = {
  id: string;
  source: "RENT_CHARGE" | "WATER_BILL";
  typeLabel: "Rent" | "Water Bill" | "Service Charge" | "Garbage";
  period: string;
  dueDate: Date;
  amountDue: number;
  balance: number;
  status: string;
  rawStatus: string;
  description?: string | null;
  receiptUrl: string | null;
  payNowHref: string | null;
  isPaid: boolean;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getChargeTypeLabel(type: ChargeType): CombinedBill["typeLabel"] | null {
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

function getChargeStatusClasses(status: ChargeStatus) {
  switch (status) {
    case "PAID":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PARTIAL":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "OVERDUE":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    case "UNPAID":
      return "border border-orange-200 bg-orange-50 text-orange-700";
    case "WAIVED":
      return "border border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function getWaterBillStatusClasses(status: BillStatus) {
  switch (status) {
    case "PAID_VERIFIED":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PAYMENT_PENDING":
    case "PAID_PENDING_VERIFICATION":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "DISPUTED":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    case "ISSUED":
      return "border border-orange-200 bg-orange-50 text-orange-700";
    case "CANCELLED":
      return "border border-neutral-200 bg-neutral-100 text-neutral-700";
    default:
      return "border border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function getBillStatusBadgeClasses(bill: CombinedBill) {
  if (bill.source === "WATER_BILL") {
    return getWaterBillStatusClasses(bill.rawStatus as BillStatus);
  }

  return getChargeStatusClasses(bill.rawStatus as ChargeStatus);
}

function isSuccessfulPayment(status: GatewayStatus) {
  return status === "SUCCESS";
}

function isVerifiedOrNotRequired(status: VerificationStatus) {
  return status === "VERIFIED" || status === "NOT_REQUIRED";
}

function getLatestReceiptUrlFromPayments(
  payments: Array<{
    receipt: { id: string; pdfUrl: string | null } | null;
    gatewayStatus: GatewayStatus;
    verificationStatus: VerificationStatus;
  }>
) {
  const matchingPayment = payments.find(
    (payment) =>
      isSuccessfulPayment(payment.gatewayStatus) &&
      isVerifiedOrNotRequired(payment.verificationStatus) &&
      payment.receipt
  );

  if (!matchingPayment?.receipt) {
    return null;
  }

  return matchingPayment.receipt.pdfUrl ?? `/tenant/receipts/${matchingPayment.receipt.id}`;
}

export default async function TenantInvoicePage() {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const tenant: TenantInvoiceResult | null = await prisma.tenant.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId,
      deletedAt: null,
    },
    ...tenantInvoiceArgs,
  });

  const activeLease = tenant?.leases?.[0];
  const unit = activeLease?.unit;

  const rentAndChargeBills: CombinedBill[] =
    activeLease?.rentCharges.flatMap((charge): CombinedBill[] => {
      const typeLabel = getChargeTypeLabel(charge.chargeType);

      if (!typeLabel) {
        return [];
      }

      const receiptUrl = getLatestReceiptUrlFromPayments(charge.payments);
      const balance = Number(charge.balance ?? 0);
      const amountDue = Number(charge.amountDue ?? 0);
      const isPaid =
        charge.status === "PAID" ||
        charge.status === "WAIVED" ||
        balance <= 0;

      return [
        {
          id: charge.id,
          source: "RENT_CHARGE",
          typeLabel,
          period: charge.period,
          dueDate: charge.dueDate,
          amountDue,
          balance,
          status: charge.status.replaceAll("_", " "),
          rawStatus: charge.status,
          description: charge.description,
          receiptUrl,
          isPaid,
          payNowHref: isPaid
            ? null
            : `/tenant/payments/new?source=rent_charge&id=${charge.id}`,
        },
      ];
    }) ?? [];

  const waterBills: CombinedBill[] =
    tenant?.waterBills
      ?.filter((bill) => !activeLease || bill.unitId === activeLease.unitId)
      .map((bill) => {
        const receiptUrl = getLatestReceiptUrlFromPayments(bill.payments);
        const amountDue = Number(bill.total ?? 0);
        const isPaid =
          bill.status === "PAID_VERIFIED" ||
          (bill.status === "PAID_PENDING_VERIFICATION" && !!receiptUrl);

        return {
          id: bill.id,
          source: "WATER_BILL" as const,
          typeLabel: "Water Bill" as const,
          period: bill.period,
          dueDate: bill.dueDate,
          amountDue,
          balance: isPaid ? 0 : amountDue,
          status: bill.status.replaceAll("_", " "),
          rawStatus: bill.status,
          description: bill.notes,
          receiptUrl,
          isPaid,
          payNowHref: isPaid
            ? null
            : `/tenant/payments/new?source=water_bill&id=${bill.id}`,
        };
      }) ?? [];

  const bills: CombinedBill[] = [...rentAndChargeBills, ...waterBills].sort(
    (a, b) => b.dueDate.getTime() - a.dueDate.getTime()
  );

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

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        <div className="space-y-4 sm:space-y-6">
          <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                  Billing Overview
                </p>
                <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
                  Bills & Invoices
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                  View all your bills in one place, including rent, water, service charge, and garbage.
                </p>
              </div>

              <div className="rounded-[24px] bg-[#f7f7fa] px-4 py-4 sm:px-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Current Unit
                </p>
                <p className="mt-1 text-base font-semibold text-neutral-950">
                  {unit ? `${unit.property.name} — ${unit.houseNo}` : "N/A"}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {unit?.building?.name ?? "No building"}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <div className="rounded-[24px] border border-black/5 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                Tenant
              </p>
              <p className="mt-3 text-[15px] font-semibold text-neutral-950">
                {tenant?.fullName ?? session.fullName}
              </p>
            </div>

            <div className="rounded-[24px] border border-black/5 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                Total Bill
              </p>
              <p className="mt-3 text-[15px] font-semibold text-neutral-950">
                {formatMoney(totalBilled)}
              </p>
            </div>

            <div className="rounded-[24px] border border-black/5 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                Outstanding
              </p>
              <p className="mt-3 text-[15px] font-semibold text-neutral-950">
                {formatMoney(totalBalance)}
              </p>
            </div>

            <div className="rounded-[24px] border border-black/5 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                Rent
              </p>
              <p className="mt-3 text-[15px] font-semibold text-neutral-950">
                {formatMoney(totalRent)}
              </p>
            </div>

            <div className="rounded-[24px] border border-black/5 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                Water
              </p>
              <p className="mt-3 text-[15px] font-semibold text-neutral-950">
                {formatMoney(totalWater)}
              </p>
            </div>

            <div className="rounded-[24px] border border-black/5 bg-white p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                Service + Garbage
              </p>
              <p className="mt-3 text-[15px] font-semibold text-neutral-950">
                {formatMoney(totalServiceCharge + totalGarbage)}
              </p>
            </div>
          </section>

          <section className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-6 xl:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
                  Bill History
                </h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Unified list of rent, water bill, service charge, and garbage
                </p>
              </div>
              <span className="text-xs font-medium text-neutral-500">
                {bills.length} items
              </span>
            </div>

            {bills.length ? (
              <>
                <div className="mt-5 space-y-3 lg:hidden">
                  {bills.map((bill) => (
                    <div
                      key={`${bill.source}-${bill.id}`}
                      className="rounded-[22px] border border-black/5 bg-[#fafafa] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-950">
                            {bill.typeLabel}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">{bill.period}</p>
                        </div>

                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getBillStatusBadgeClasses(
                            bill
                          )}`}
                        >
                          {bill.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-[16px] bg-white px-3 py-3">
                          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                            Due Date
                          </p>
                          <p className="mt-1 text-sm font-semibold text-neutral-950">
                            {formatDate(bill.dueDate)}
                          </p>
                        </div>

                        <div className="rounded-[16px] bg-white px-3 py-3">
                          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                            Amount
                          </p>
                          <p className="mt-1 text-sm font-semibold text-neutral-950">
                            {formatMoney(bill.amountDue)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-[16px] bg-white px-3 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                          Balance
                        </p>
                        <p className="mt-1 text-sm font-semibold text-neutral-950">
                          {formatMoney(bill.balance)}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {bill.isPaid ? (
                          bill.receiptUrl ? (
                            <Link
                              href={bill.receiptUrl}
                              className="inline-flex items-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
                            >
                              Download Receipt
                            </Link>
                          ) : (
                            <span className="inline-flex items-center rounded-[16px] border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-500">
                              Paid
                            </span>
                          )
                        ) : bill.payNowHref ? (
                          <Link
                            href={bill.payNowHref}
                            className="inline-flex items-center rounded-[16px] bg-neutral-900 px-4 py-3 text-sm font-medium text-white"
                          >
                            Pay Now
                          </Link>
                        ) : null}
                      </div>

                      {bill.description ? (
                        <div className="mt-3 rounded-[16px] bg-white px-3 py-3">
                          <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                            Notes
                          </p>
                          <p className="mt-1 text-sm text-neutral-700">{bill.description}</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-5 hidden overflow-hidden rounded-[24px] border border-black/5 bg-white lg:block">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-neutral-200 bg-[#fcfcfd]">
                      <tr className="text-left text-neutral-500">
                        <th className="px-5 py-4 font-medium">Bill Type</th>
                        <th className="px-5 py-4 font-medium">Period</th>
                        <th className="px-5 py-4 font-medium">Due Date</th>
                        <th className="px-5 py-4 font-medium">Amount Due</th>
                        <th className="px-5 py-4 font-medium">Balance</th>
                        <th className="px-5 py-4 font-medium">Status</th>
                        <th className="px-5 py-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((bill) => (
                        <tr
                          key={`${bill.source}-${bill.id}`}
                          className="border-b border-neutral-100 last:border-0"
                        >
                          <td className="px-5 py-4 font-semibold text-neutral-950">
                            {bill.typeLabel}
                          </td>
                          <td className="px-5 py-4 text-neutral-600">{bill.period}</td>
                          <td className="px-5 py-4 text-neutral-600">
                            {formatDate(bill.dueDate)}
                          </td>
                          <td className="px-5 py-4 text-neutral-600">
                            {formatMoney(bill.amountDue)}
                          </td>
                          <td className="px-5 py-4 font-semibold text-neutral-950">
                            {formatMoney(bill.balance)}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getBillStatusBadgeClasses(
                                bill
                              )}`}
                            >
                              {bill.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {bill.isPaid ? (
                              bill.receiptUrl ? (
                                <Link
                                  href={bill.receiptUrl}
                                  className="inline-flex items-center rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
                                >
                                  Download Receipt
                                </Link>
                              ) : (
                                <span className="text-sm text-neutral-500">Paid</span>
                              )
                            ) : bill.payNowHref ? (
                              <Link
                                href={bill.payNowHref}
                                className="inline-flex items-center rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
                              >
                                Pay Now
                              </Link>
                            ) : (
                              <span className="text-sm text-neutral-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot className="border-t border-neutral-200 bg-[#fafafa]">
                      <tr>
                        <td colSpan={3} className="px-5 py-4 text-sm font-semibold text-neutral-950">
                          Total Bill
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-neutral-950">
                          {formatMoney(totalBilled)}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-neutral-950">
                          {formatMoney(totalBalance)}
                        </td>
                        <td className="px-5 py-4" />
                        <td className="px-5 py-4" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-[20px] bg-[#fafafa] p-4 text-sm text-neutral-500">
                No bills found.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}