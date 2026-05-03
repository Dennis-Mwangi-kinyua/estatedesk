import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

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

async function getCaretakerAllowedUnitIds({
  orgId,
  caretakerUserId,
  scopedUnitId,
}: {
  orgId: string;
  caretakerUserId: string;
  scopedUnitId: string | null;
}) {
  /*
   * Best case:
   * The caretaker membership is UNIT-scoped.
   * Then this caretaker can only access that one apartment/unit.
   */
  if (scopedUnitId) {
    return [scopedUnitId];
  }

  /*
   * Fallback:
   * If the membership is not UNIT-scoped, use active CaretakerAssignment rows.
   * For one-apartment access, make sure the caretaker has only one active
   * assignment with unitId set.
   */
  const assignments = await prisma.caretakerAssignment.findMany({
    where: {
      orgId,
      caretakerUserId,
      active: true,
      endedAt: null,
      unitId: {
        not: null,
      },
    },
    select: {
      unitId: true,
    },
  });

  return Array.from(
    new Set(
      assignments
        .map((assignment) => assignment.unitId)
        .filter((unitId): unitId is string => Boolean(unitId)),
    ),
  );
}

export default async function LeasesPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    redirect("/login");
  }

  if (session.activeOrgRole !== "CARETAKER") {
    redirect("/dashboard");
  }

  const orgId = session.activeOrgId;
  const caretakerUserId = session.userId;

  const scopedUnitId =
    session.membershipScope?.scopeType === "UNIT"
      ? session.membershipScope.scopeId
      : null;

  const allowedUnitIds = await getCaretakerAllowedUnitIds({
    orgId,
    caretakerUserId,
    scopedUnitId,
  });

  const leases =
    allowedUnitIds.length === 0
      ? []
      : await prisma.lease.findMany({
          where: {
            orgId,
            deletedAt: null,
            unitId: {
              in: allowedUnitIds,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
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
        });

  const totalLeases = leases.length;
  const activeLeases = leases.filter((lease) => lease.status === "ACTIVE").length;
  const nonActiveLeases = totalLeases - activeLeases;

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Leases</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View leases for your assigned apartment only.
          </p>
        </div>

        <Link
          href="/dashboard/caretaker/tenants"
          className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          View Tenants
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Leases</p>
          <p className="mt-2 text-2xl font-semibold">{totalLeases}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Active Leases</p>
          <p className="mt-2 text-2xl font-semibold">{activeLeases}</p>
        </div>

        <div className="rounded-xl border bg-background p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Other Statuses</p>
          <p className="mt-2 text-2xl font-semibold">{nonActiveLeases}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">Assigned Apartment Leases</h2>
        </div>

        {leases.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No leases found for your assigned apartment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Building</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Lease Status</th>
                  <th className="px-4 py-3 font-medium">Monthly Rent</th>
                  <th className="px-4 py-3 font-medium">Start</th>
                  <th className="px-4 py-3 font-medium">End</th>
                </tr>
              </thead>

              <tbody>
                {leases.map((lease) => (
                  <tr key={lease.id} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      {lease.tenant?.fullName ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {lease.tenant?.phone ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {lease.unit?.property ? (
                        <Link
                          href={`/properties/${lease.unit.property.id}`}
                          className="underline underline-offset-4"
                        >
                          {lease.unit.property.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {lease.unit?.building?.name ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      {lease.unit?.houseNo ?? "—"}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                        {lease.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {lease.monthlyRent != null
                        ? formatCurrency(lease.monthlyRent)
                        : lease.unit?.rentAmount != null
                          ? formatCurrency(lease.unit.rentAmount)
                          : "—"}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(lease.startDate)}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(lease.endDate)}
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