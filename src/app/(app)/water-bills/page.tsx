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

export default async function WaterBillsPage() {
  const waterBills = await prisma.waterBill.findMany({
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
      tenant: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          status: true,
        },
      },
      unit: {
        select: {
          id: true,
          houseNo: true,
          status: true,
          property: {
            select: {
              id: true,
              name: true,
              waterRatePerUnit: true,
              waterFixedCharge: true,
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
      payments: {
        select: {
          id: true,
          amount: true,
          method: true,
          gatewayStatus: true,
          verificationStatus: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  const totalBills = waterBills.length;
  const issuedBills = waterBills.filter((bill) => bill.status === "ISSUED").length;
  const pendingBills = waterBills.filter(
    (bill) => bill.status === "PAYMENT_PENDING"
  ).length;
  const verifiedBills = waterBills.filter(
    (bill) => bill.status === "PAID_VERIFIED"
  ).length;

  const totalAmount = waterBills.reduce(
    (sum: number, bill) => sum + toNumber(bill.total),
    0
  );

  const totalCollected = waterBills.reduce((sum: number, bill) => {
    const paid = bill.payments.reduce(
      (paymentSum: number, payment) => paymentSum + toNumber(payment.amount),
      0
    );
    return sum + paid;
  }, 0);

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Water Bills</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and manage water bills across all units.
          </p>
        </div>

        <Link
          href="/payments"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          View Payments
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Bills</p>
          <p className="mt-2 text-2xl font-semibold">{totalBills}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Issued</p>
          <p className="mt-2 text-2xl font-semibold">{issuedBills}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Payment Pending</p>
          <p className="mt-2 text-2xl font-semibold">{pendingBills}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Paid Verified</p>
          <p className="mt-2 text-2xl font-semibold">{verifiedBills}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Billed</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalAmount)}</p>
        </div>
      </section>

      <section className="rounded-xl border bg-background p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Total Collected</p>
        <p className="mt-2 text-2xl font-semibold">
          {formatCurrency(totalCollected)}
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">All Water Bills</h2>
        </div>

        {waterBills.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No water bills found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Units Used</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                  <th className="px-4 py-3 font-medium">Fixed Charge</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                </tr>
              </thead>
              <tbody>
                {waterBills.map((bill) => {
                  const paidAmount = bill.payments.reduce(
                    (sum: number, payment) => sum + toNumber(payment.amount),
                    0
                  );

                  return (
                    <tr key={bill.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{bill.period}</td>
                      <td className="px-4 py-3">{bill.tenant.fullName}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/properties/${bill.unit.property.id}`}
                          className="underline underline-offset-4"
                        >
                          {bill.unit.property.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{bill.unit.building?.name ?? "—"}</td>
                      <td className="px-4 py-3">{bill.unit.houseNo}</td>
                      <td className="px-4 py-3">{bill.unitsUsed}</td>
                      <td className="px-4 py-3">
                        {formatCurrency(bill.ratePerUnit)}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(bill.fixedCharge)}
                      </td>
                      <td className="px-4 py-3">{formatCurrency(bill.total)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatDate(bill.dueDate)}</td>
                      <td className="px-4 py-3">{formatCurrency(paidAmount)}</td>
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