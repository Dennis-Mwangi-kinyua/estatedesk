import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatCurrency(value: unknown) {
  const amount =
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
      ? (value as { toNumber: () => number }).toNumber()
      : Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      leases: {
        where: {
          deletedAt: null,
        },
        orderBy: [
          { status: "asc" },
          { createdAt: "desc" },
        ],
        include: {
          unit: {
            select: {
              id: true,
              houseNo: true,
              rentAmount: true,
              status: true,
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

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((tenant) => tenant.status === "ACTIVE").length;
  const inactiveTenants = tenants.filter((tenant) => tenant.status === "INACTIVE").length;
  const blacklistedTenants = tenants.filter(
    (tenant) => tenant.status === "BLACKLISTED"
  ).length;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Tenants</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View and manage all tenants.
          </p>
        </div>

        <Link
          href="/properties"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          View Properties
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Tenants</p>
          <p className="mt-2 text-2xl font-semibold">{totalTenants}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="mt-2 text-2xl font-semibold">{activeTenants}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Inactive</p>
          <p className="mt-2 text-2xl font-semibold">{inactiveTenants}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Blacklisted</p>
          <p className="mt-2 text-2xl font-semibold">{blacklistedTenants}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">All Tenants</h2>
        </div>

        {tenants.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No tenants found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Current Property</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Monthly Rent</th>
                  <th className="px-4 py-3 font-medium">Lease Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => {
                  const currentLease =
                    tenant.leases.find((lease) => lease.status === "ACTIVE") ??
                    tenant.leases[0];

                  return (
                    <tr key={tenant.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{tenant.fullName}</td>
                      <td className="px-4 py-3">{tenant.phone}</td>
                      <td className="px-4 py-3">{tenant.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                          {tenant.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {currentLease?.unit?.property ? (
                          <Link
                            href={`/properties/${currentLease.unit.property.id}`}
                            className="underline underline-offset-4"
                          >
                            {currentLease.unit.property.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {currentLease?.unit?.building?.name ?? "—"}
                      </td>

                      <td className="px-4 py-3">
                        {currentLease?.unit?.houseNo ?? "—"}
                      </td>

                      <td className="px-4 py-3">
                        {currentLease?.monthlyRent
                          ? formatCurrency(currentLease.monthlyRent)
                          : currentLease?.unit?.rentAmount
                          ? formatCurrency(currentLease.unit.rentAmount)
                          : "—"}
                      </td>

                      <td className="px-4 py-3">
                        {currentLease ? currentLease.status : "NO_LEASE"}
                      </td>

                      <td className="px-4 py-3">{formatDate(tenant.createdAt)}</td>
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