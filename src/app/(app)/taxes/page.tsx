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

export default async function TaxesPage() {
  const taxes = await prisma.taxCharge.findMany({
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
      property: {
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
      lease: {
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
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

  const totalTaxes = taxes.length;
  const pendingTaxes = taxes.filter((tax) => tax.status === "PENDING").length;
  const partialTaxes = taxes.filter((tax) => tax.status === "PARTIAL").length;
  const paidTaxes = taxes.filter((tax) => tax.status === "PAID").length;
  const overdueTaxes = taxes.filter((tax) => tax.status === "OVERDUE").length;

  const totalDue = taxes.reduce(
    (sum: number, tax) => sum + toNumber(tax.amountDue),
    0
  );

  const totalPaid = taxes.reduce(
    (sum: number, tax) => sum + toNumber(tax.amountPaid),
    0
  );

  const totalBalance = taxes.reduce(
    (sum: number, tax) => sum + toNumber(tax.balance),
    0
  );

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Taxes</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track tax charges, balances, and tax-related payments.
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
          <p className="text-sm text-muted-foreground">Total Tax Charges</p>
          <p className="mt-2 text-2xl font-semibold">{totalTaxes}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="mt-2 text-2xl font-semibold">{pendingTaxes}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Partial</p>
          <p className="mt-2 text-2xl font-semibold">{partialTaxes}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="mt-2 text-2xl font-semibold">{paidTaxes}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <p className="mt-2 text-2xl font-semibold">{overdueTaxes}</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Amount Due</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalDue)}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Amount Paid</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalPaid)}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Outstanding Balance</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totalBalance)}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">All Tax Charges</h2>
        </div>

        {taxes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No tax charges found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Tax Type</th>
                  <th className="px-4 py-3 font-medium">Authority</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Amount Due</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map((tax) => {
                  const property =
                    tax.property ?? tax.lease?.unit.property ?? null;
                  const building = tax.lease?.unit.building ?? null;
                  const unit = tax.lease?.unit ?? null;
                  const tenant = tax.tenant ?? null;

                  return (
                    <tr key={tax.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{tax.period}</td>
                      <td className="px-4 py-3">{tax.taxType}</td>
                      <td className="px-4 py-3">{tax.taxAuthority}</td>

                      <td className="px-4 py-3">
                        {property ? (
                          <Link
                            href={`/properties/${property.id}`}
                            className="underline underline-offset-4"
                          >
                            {property.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-4 py-3">{building?.name ?? "—"}</td>
                      <td className="px-4 py-3">{unit?.houseNo ?? "—"}</td>
                      <td className="px-4 py-3">{tenant?.fullName ?? "—"}</td>

                      <td className="px-4 py-3">
                        {formatCurrency(tax.amountDue)}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(tax.amountPaid)}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(tax.balance)}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                          {tax.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">{formatDate(tax.dueDate)}</td>
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