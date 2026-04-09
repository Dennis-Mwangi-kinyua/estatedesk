import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    unitId: string;
  }>;
};

function formatCurrency(value: unknown) {
  const amount =
    typeof value === "object" && value !== null && "toNumber" in value
      ? (value as { toNumber(): number }).toNumber()
      : Number(value ?? 0);

  return `KES ${amount.toLocaleString()}`;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value.replaceAll("_", " ");
}

function statusClasses(status: string | null | undefined) {
  switch (status) {
    case "OCCUPIED":
    case "ACTIVE":
    case "PAID_VERIFIED":
    case "VERIFIED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "VACANT":
    case "PENDING":
    case "ISSUED":
    case "SUBMITTED":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "OVERDUE":
    case "FAILED":
    case "REJECTED":
    case "CANCELLED":
    case "TERMINATED":
      return "bg-red-50 text-red-700 ring-1 ring-red-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
        status
      )}`}
    >
      {formatLabel(status)}
    </span>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-2 text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

export default async function UnitDetailsPage({ params }: PageProps) {
  const { unitId } = await params;

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
          type: true,
        },
      },
      building: {
        select: {
          id: true,
          name: true,
        },
      },
      leases: {
        where: {
          deletedAt: null,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
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
        },
      },
      issues: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      },
      meterReadings: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          period: true,
          prevReading: true,
          currentReading: true,
          unitsUsed: true,
          status: true,
          createdAt: true,
        },
      },
      waterBills: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          period: true,
          unitsUsed: true,
          total: true,
          dueDate: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!unit || unit.deletedAt) {
    notFound();
  }

  const activeLease =
    unit.leases.find((lease) => lease.status === "ACTIVE") ?? unit.leases[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              Unit {unit.houseNo}
            </h1>
            <StatusBadge status={unit.status} />
          </div>

          <p className="mt-2 text-sm text-gray-500">
            {formatLabel(unit.type)} in{" "}
            <span className="font-medium text-gray-900">
              {unit.property.name}
            </span>
            {unit.building ? (
              <>
                {" "}
                • Building{" "}
                <span className="font-medium text-gray-900">
                  {unit.building.name}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/org/units"
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back to Units
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Rent Amount" value={formatCurrency(unit.rentAmount)} />
        <InfoCard
          label="Deposit Amount"
          value={formatCurrency(unit.depositAmount)}
        />
        <InfoCard label="Bedrooms" value={unit.bedrooms ?? "—"} />
        <InfoCard label="Bathrooms" value={unit.bathrooms ?? "—"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Unit Details</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoCard label="House Number" value={unit.houseNo} />
              <InfoCard label="Unit Type" value={formatLabel(unit.type)} />
              <InfoCard label="Status" value={formatLabel(unit.status)} />
              <InfoCard
                label="Floor Area"
                value={unit.floorArea ? `${unit.floorArea} sqm` : "—"}
              />
              <InfoCard
                label="Vacant Since"
                value={formatDate(unit.vacantSince)}
              />
              <InfoCard label="Active" value={unit.isActive ? "Yes" : "No"} />
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Notes
              </p>
              <p className="mt-2 text-sm text-gray-700">
                {unit.notes?.trim() || "No notes added for this unit."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Current Occupancy</h2>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              {activeLease ? (
                <>
                  <p className="text-sm text-gray-500">Active Tenant</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {activeLease.tenant.fullName}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    {activeLease.tenant.phone}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {activeLease.tenant.email || "No email"}
                  </p>
                  <div className="mt-3">
                    <StatusBadge status={activeLease.status} />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500">Active Tenant</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    None
                  </p>
                  <p className="mt-2 text-sm text-gray-600">
                    This unit currently has no active lease.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}