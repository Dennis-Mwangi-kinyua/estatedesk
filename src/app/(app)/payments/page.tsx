import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toNumber(value: unknown): number {
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function getTargetLabel(targetType: string) {
  switch (targetType) {
    case "RENT":
      return "Rent";
    case "WATER":
      return "Water";
    case "DEPOSIT":
      return "Deposit";
    case "TAX":
      return "Tax";
    default:
      return targetType;
  }
}

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      org: {
        select: {
          id: true,
          name: true,
        },
      },
      payerTenant: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          status: true,
        },
      },
      rentCharge: {
        select: {
          id: true,
          period: true,
          chargeType: true,
          status: true,
          amountDue: true,
          amountPaid: true,
          balance: true,
          dueDate: true,
          lease: {
            select: {
              id: true,
              unit: {
                select: {
                  id: true,
                  houseNo: true,
                  property: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  building: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      waterBill: {
        select: {
          id: true,
          period: true,
          unitsUsed: true,
          total: true,
          dueDate: true,
          status: true,
          unit: {
            select: {
              id: true,
              houseNo: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
              building: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      taxCharge: {
        select: {
          id: true,
          period: true,
          taxType: true,
          status: true,
          amountDue: true,
          amountPaid: true,
          balance: true,
          dueDate: true,
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      receipt: {
        select: {
          id: true,
          receiptNo: true,
          issuedAt: true,
          pdfUrl: true,
        },
      },
    },
  });

  const totalPayments = payments.length;

  const totalAmount = payments.reduce(
    (sum: number, payment) => sum + toNumber(payment.amount),
    0
  );

  const successfulPayments = payments.filter(
    (payment) => payment.gatewayStatus === "SUCCESS"
  ).length;

  const pendingPayments = payments.filter(
    (payment) =>
      payment.gatewayStatus === "PENDING" ||
      payment.gatewayStatus === "INITIATED"
  ).length;

  const verifiedPayments = payments.filter(
    (payment) => payment.verificationStatus === "VERIFIED"
  ).length;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Payments</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and track all tenant payments.
          </p>
        </div>

        <Link
          href="/charges"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          View Charges
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Payments</p>
          <p className="mt-2 text-2xl font-semibold">{totalPayments}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Amount</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalAmount)}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Successful</p>
          <p className="mt-2 text-2xl font-semibold">{successfulPayments}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Verified</p>
          <p className="mt-2 text-2xl font-semibold">{verifiedPayments}</p>
        </div>
      </section>

      <section className="rounded-xl border bg-background p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Pending Gateway Payments</p>
        <p className="mt-2 text-2xl font-semibold">{pendingPayments}</p>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">All Payments</h2>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No payments found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Gateway</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Paid At</th>
                  <th className="px-4 py-3 font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const linkedProperty =
                    payment.rentCharge?.lease.unit.property ??
                    payment.waterBill?.unit.property ??
                    payment.taxCharge?.property ??
                    null;

                  const linkedBuilding =
                    payment.rentCharge?.lease.unit.building ??
                    payment.waterBill?.unit.building ??
                    null;

                  const linkedUnit =
                    payment.rentCharge?.lease.unit ??
                    payment.waterBill?.unit ??
                    null;

                  return (
                    <tr key={payment.id} className="border-t">
                      <td className="px-4 py-3 font-medium">
                        {payment.payerTenant.fullName}
                      </td>

                      <td className="px-4 py-3">
                        {getTargetLabel(payment.targetType)}
                      </td>

                      <td className="px-4 py-3">
                        {linkedProperty ? (
                          <Link
                            href={`/properties/${linkedProperty.id}`}
                            className="underline underline-offset-4"
                          >
                            {linkedProperty.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-4 py-3">{linkedBuilding?.name ?? "—"}</td>

                      <td className="px-4 py-3">{linkedUnit?.houseNo ?? "—"}</td>

                      <td className="px-4 py-3">{formatCurrency(payment.amount)}</td>

                      <td className="px-4 py-3">{payment.method}</td>

                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                          {payment.gatewayStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                          {payment.verificationStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {payment.reference ??
                          payment.externalReference ??
                          payment.checkoutRequestId ??
                          "—"}
                      </td>

                      <td className="px-4 py-3">{formatDate(payment.paidAt)}</td>

                      <td className="px-4 py-3">
                        {payment.receipt?.receiptNo ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}