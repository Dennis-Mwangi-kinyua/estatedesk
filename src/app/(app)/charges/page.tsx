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

export default async function ChargesPage() {
  const charges = await prisma.rentCharge.findMany({
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
      lease: {
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          dueDay: true,
          monthlyRent: true,
          deposit: true,
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
              rentAmount: true,
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
  });

  const totalCharges = charges.length;
  const unpaidCharges = charges.filter((charge) => charge.status === "UNPAID").length;
  const partialCharges = charges.filter((charge) => charge.status === "PARTIAL").length;
  const paidCharges = charges.filter((charge) => charge.status === "PAID").length;

  const totalAmountDue = charges.reduce(
    (sum: number, charge) => sum + toNumber(charge.amountDue),
    0
  );

  const totalBalance = charges.reduce(
    (sum: number, charge) => sum + toNumber(charge.balance),
    0
  );

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Charges</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and manage rent charges across all leases.
          </p>
        </div>

        <Link
          href="/leases"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          View Leases
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Charges</p>
          <p className="mt-2 text-2xl font-semibold">{totalCharges}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Unpaid</p>
          <p className="mt-2 text-2xl font-semibold">{unpaidCharges}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Partial</p>
          <p className="mt-2 text-2xl font-semibold">{partialCharges}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="mt-2 text-2xl font-semibold">{paidCharges}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Outstanding Balance</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalBalance)}</p>
        </div>
      </section>

      <section className="rounded-xl border bg-background p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Total Amount Due</p>
        <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalAmountDue)}</p>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">All Rent Charges</h2>
        </div>

        {charges.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No rent charges found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Amount Due</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Lease Start</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{charge.period}</td>
                    <td className="px-4 py-3">{charge.chargeType}</td>
                    <td className="px-4 py-3">{charge.lease.tenant.fullName}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/properties/${charge.lease.unit.property.id}`}
                        className="underline underline-offset-4"
                      >
                        {charge.lease.unit.property.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {charge.lease.unit.building?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">{charge.lease.unit.houseNo}</td>
                    <td className="px-4 py-3">{formatCurrency(charge.amountDue)}</td>
                    <td className="px-4 py-3">{formatCurrency(charge.amountPaid)}</td>
                    <td className="px-4 py-3">{formatCurrency(charge.balance)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                        {charge.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(charge.dueDate)}</td>
                    <td className="px-4 py-3">{formatDate(charge.lease.startDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}