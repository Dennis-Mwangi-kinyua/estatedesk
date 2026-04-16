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

function formatCurrency(value: unknown, currencyCode = "KES") {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
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

function getLeaseStatusClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "EXPIRED":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "TERMINATED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default async function LeasesPage() {
  const leases = await prisma.lease.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      org: {
        select: {
          id: true,
          name: true,
          currencyCode: true,
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
      caretaker: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
      contractDocument: {
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          assetType: true,
          createdAt: true,
        },
      },
      unit: {
        select: {
          id: true,
          houseNo: true,
          type: true,
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
      rentCharges: {
        select: {
          id: true,
          amountDue: true,
          amountPaid: true,
          balance: true,
          status: true,
          dueDate: true,
          chargeType: true,
        },
      },
      taxCharges: {
        select: {
          id: true,
          taxType: true,
          amountDue: true,
          amountPaid: true,
          balance: true,
          status: true,
          dueDate: true,
        },
      },
      moveOutNotices: {
        select: {
          id: true,
          noticeDate: true,
          moveOutDate: true,
          status: true,
        },
      },
    },
  });

  const totalLeases = leases.length;
  const activeLeases = leases.filter((lease) => lease.status === "ACTIVE").length;
  const pendingLeases = leases.filter((lease) => lease.status === "PENDING").length;
  const expiredLeases = leases.filter((lease) => lease.status === "EXPIRED").length;
  const terminatedLeases = leases.filter(
    (lease) => lease.status === "TERMINATED"
  ).length;

  const totalMonthlyRent = leases.reduce(
    (sum, lease) => sum + toNumber(lease.monthlyRent),
    0
  );

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Leases</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and manage all lease records across organizations.
          </p>
        </div>

        <Link
          href="/tenants"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          View Tenants
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Leases</p>
          <p className="mt-2 text-2xl font-semibold">{totalLeases}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="mt-2 text-2xl font-semibold">{activeLeases}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="mt-2 text-2xl font-semibold">{pendingLeases}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Expired</p>
          <p className="mt-2 text-2xl font-semibold">{expiredLeases}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Terminated</p>
          <p className="mt-2 text-2xl font-semibold">{terminatedLeases}</p>
        </div>
      </section>

      <section className="rounded-xl border bg-background p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">Total Monthly Rent</p>
        <p className="mt-2 text-2xl font-semibold">
          {formatCurrency(totalMonthlyRent)}
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">All Leases</h2>
        </div>

        {leases.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No leases found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Lease</th>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Monthly Rent</th>
                  <th className="px-4 py-3 font-medium">Deposit</th>
                  <th className="px-4 py-3 font-medium">Due Day</th>
                  <th className="px-4 py-3 font-medium">Start Date</th>
                  <th className="px-4 py-3 font-medium">End Date</th>
                  <th className="px-4 py-3 font-medium">Caretaker</th>
                  <th className="px-4 py-3 font-medium">Contract</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {leases.map((lease) => (
                  <tr key={lease.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/leases/${lease.id}`}
                        className="underline underline-offset-4"
                      >
                        {lease.id}
                      </Link>
                    </td>

                    <td className="px-4 py-3">{lease.org.name}</td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/tenants/${lease.tenant.id}`}
                        className="underline underline-offset-4"
                      >
                        {lease.tenant.fullName}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/properties/${lease.unit.property.id}`}
                        className="underline underline-offset-4"
                      >
                        {lease.unit.property.name}
                      </Link>
                    </td>

                    <td className="px-4 py-3">{lease.unit.building?.name ?? "—"}</td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/units/${lease.unit.id}`}
                        className="underline underline-offset-4"
                      >
                        {lease.unit.houseNo}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      {formatCurrency(
                        lease.monthlyRent,
                        lease.org.currencyCode ?? "KES"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {formatCurrency(
                        lease.deposit,
                        lease.org.currencyCode ?? "KES"
                      )}
                    </td>

                    <td className="px-4 py-3">{lease.dueDay}</td>

                    <td className="px-4 py-3">{formatDate(lease.startDate)}</td>

                    <td className="px-4 py-3">{formatDate(lease.endDate)}</td>

                    <td className="px-4 py-3">
                      {lease.caretaker ? (
                        <Link
                          href={`/staff/${lease.caretaker.id}`}
                          className="underline underline-offset-4"
                        >
                          {lease.caretaker.fullName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {lease.contractDocument?.fileName ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${getLeaseStatusClass(
                          lease.status
                        )}`}
                      >
                        {lease.status}
                      </span>
                    </td>
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