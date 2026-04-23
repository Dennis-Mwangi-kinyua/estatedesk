import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

type UnitDetailsPageProps = {
  params: Promise<{
    unitId: string;
  }>;
};

function formatCurrency(value: unknown, currencyCode = "KES") {
  const amount =
    typeof value === "object" && value !== null && "toNumber" in value
      ? (value as { toNumber: () => number }).toNumber()
      : Number(value ?? 0);

  if (Number.isNaN(amount)) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(date);
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatEnumLabel(value: string | null | undefined) {
  if (!value) return "Unknown";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatUnitTypeLabel(
  type: string | null | undefined,
  bedrooms: number | null | undefined,
) {
  if (!type) return "Unknown";

  if (type === "APARTMENT") {
    if (bedrooms && bedrooms > 0) {
      return `${bedrooms} Bedroom Apartment`;
    }

    return "Apartment";
  }

  if (type === "SINGLE_ROOM") {
    return "Single Room";
  }

  return formatEnumLabel(type);
}

function statusClasses(status: string | null | undefined) {
  switch (status) {
    case "OCCUPIED":
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "VACANT":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "RESERVED":
    case "PENDING":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "UNDER_MAINTENANCE":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    case "INACTIVE":
    case "DISABLED":
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-slate-700">{value}</div>
    </div>
  );
}

export default async function UnitDetailsPage({
  params,
}: UnitDetailsPageProps) {
  const session = await requireManagementAccess();
  const { unitId } = await params;

  const organization = await prisma.organization.findFirst({
    where: {
      id: session.activeOrgId!,
      deletedAt: null,
    },
    select: {
      currencyCode: true,
      name: true,
    },
  });

  const currencyCode = organization?.currencyCode ?? "KES";

  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      deletedAt: null,
      property: {
        orgId: session.activeOrgId!,
        deletedAt: null,
      },
    },
    select: {
      id: true,
      houseNo: true,
      type: true,
      bedrooms: true,
      bathrooms: true,
      floorArea: true,
      rentAmount: true,
      depositAmount: true,
      status: true,
      vacantSince: true,
      notes: true,
      isActive: true,
      sequenceNo: true,
      createdAt: true,
      updatedAt: true,
      property: {
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
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
      sourcePlan: {
        select: {
          id: true,
          unitType: true,
          bedrooms: true,
          bathrooms: true,
          quantity: true,
          defaultRentAmount: true,
          defaultDepositAmount: true,
          houseNoPrefix: true,
          startNumber: true,
          label: true,
          notes: true,
          sortOrder: true,
        },
      },
      leases: {
        where: {
          deletedAt: null,
        },
        orderBy: [
          { startDate: "desc" },
          { createdAt: "desc" },
        ],
        take: 5,
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          monthlyRent: true,
          deposit: true,
          dueDay: true,
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
        orderBy: [{ createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          createdAt: true,
        },
      },
      waterBills: {
        orderBy: [{ createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          period: true,
          total: true,
          dueDate: true,
          status: true,
          tenant: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },
      meterReadings: {
        orderBy: [{ createdAt: "desc" }],
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
      _count: {
        select: {
          leases: true,
          issues: true,
          waterBills: true,
          meterReadings: true,
        },
      },
    },
  });

  if (!unit) {
    notFound();
  }

  const currentLease =
    unit.leases.find((lease) => lease.status === "ACTIVE") ??
    unit.leases.find((lease) => lease.status === "PENDING") ??
    null;

  const totalOpenIssues = unit.issues.filter(
    (issue) => issue.status === "OPEN" || issue.status === "IN_PROGRESS",
  ).length;

  const latestWaterBill = unit.waterBills[0] ?? null;
  const latestMeterReading = unit.meterReadings[0] ?? null;

  return (
    <div className="min-h-screen bg-[#f2f2f7]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide text-slate-500">
                Dashboard
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Unit {unit.houseNo}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Review unit details, leasing activity, billing records, meter
                readings, and maintenance status from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/org/units"
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Back to Units
              </Link>
              <Link
                href={`/dashboard/org/properties/${unit.property.id}`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                View Property
              </Link>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200/80 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-900">
                      {formatUnitTypeLabel(unit.type, unit.bedrooms)}
                    </h2>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                        unit.status,
                      )}`}
                    >
                      {formatEnumLabel(unit.status)}
                    </span>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        unit.isActive
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                      }`}
                    >
                      {unit.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {unit.property.name}
                    {unit.building ? ` • ${unit.building.name}` : ""}
                    {unit.property.location ? ` • ${unit.property.location}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Monthly rent
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatCurrency(unit.rentAmount, currencyCode)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Deposit
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {unit.depositAmount
                        ? formatCurrency(unit.depositAmount, currencyCode)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-6">
              <StatCard
                title="Lease Records"
                value={unit._count.leases}
                subtitle="Historical and current"
              />
              <StatCard
                title="Open Issues"
                value={totalOpenIssues}
                subtitle="Open or in progress"
              />
              <StatCard
                title="Water Bills"
                value={unit._count.waterBills}
                subtitle="Issued for this unit"
              />
              <StatCard
                title="Meter Readings"
                value={unit._count.meterReadings}
                subtitle="Captured over time"
              />
            </div>
          </section>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-8">
              <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Unit profile
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Core information, pricing, classification, and generated plan details.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <DetailItem label="Unit Number" value={unit.houseNo} />
                  <DetailItem
                    label="Unit Type"
                    value={formatUnitTypeLabel(unit.type, unit.bedrooms)}
                  />
                  <DetailItem label="Bedrooms" value={unit.bedrooms ?? "—"} />
                  <DetailItem label="Bathrooms" value={unit.bathrooms ?? "—"} />
                  <DetailItem
                    label="Floor Area"
                    value={unit.floorArea ? `${unit.floorArea} sqm` : "—"}
                  />
                  <DetailItem
                    label="Sequence Number"
                    value={unit.sequenceNo ?? "—"}
                  />
                  <DetailItem
                    label="Rent Amount"
                    value={formatCurrency(unit.rentAmount, currencyCode)}
                  />
                  <DetailItem
                    label="Deposit Amount"
                    value={
                      unit.depositAmount
                        ? formatCurrency(unit.depositAmount, currencyCode)
                        : "—"
                    }
                  />
                  <DetailItem
                    label="Vacant Since"
                    value={formatDate(unit.vacantSince)}
                  />
                </div>

                {unit.notes ? (
                  <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Notes
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {unit.notes}
                    </p>
                  </div>
                ) : null}
              </section>

              <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Property & building context
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    See how this unit fits into the wider property structure.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailItem
                    label="Property"
                    value={
                      <Link
                        href={`/dashboard/org/properties/${unit.property.id}`}
                        className="text-slate-900 hover:text-slate-700"
                      >
                        {unit.property.name}
                      </Link>
                    }
                  />
                  <DetailItem
                    label="Building"
                    value={
                      unit.building ? (
                        unit.building.name
                      ) : (
                        <span className="text-slate-500">No building assigned</span>
                      )
                    }
                  />
                  <DetailItem
                    label="Location"
                    value={unit.property.location || "—"}
                  />
                  <DetailItem
                    label="Address"
                    value={unit.property.address || "—"}
                  />
                  <DetailItem
                    label="Water Rate"
                    value={
                      unit.property.waterRatePerUnit
                        ? formatCurrency(unit.property.waterRatePerUnit, currencyCode)
                        : "—"
                    }
                  />
                  <DetailItem
                    label="Water Fixed Charge"
                    value={
                      unit.property.waterFixedCharge
                        ? formatCurrency(unit.property.waterFixedCharge, currencyCode)
                        : "—"
                    }
                  />
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Leasing overview
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Current and recent lease records linked to this unit.
                  </p>
                </div>

                {unit.leases.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center">
                    <p className="text-sm font-medium text-slate-900">
                      No lease records found
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      This unit has not been linked to a lease yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {unit.leases.map((lease) => (
                      <div
                        key={lease.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900">
                                {lease.tenant.fullName}
                              </p>
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusClasses(
                                  lease.status,
                                )}`}
                              >
                                {formatEnumLabel(lease.status)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                              {lease.tenant.phone || "No phone"}{" "}
                              {lease.tenant.email ? `• ${lease.tenant.email}` : ""}
                            </p>
                          </div>

                          <div className="text-sm text-slate-500">
                            Start: {formatDate(lease.startDate)}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <DetailItem
                            label="Monthly Rent"
                            value={formatCurrency(lease.monthlyRent, currencyCode)}
                          />
                          <DetailItem
                            label="Deposit"
                            value={
                              lease.deposit
                                ? formatCurrency(lease.deposit, currencyCode)
                                : "—"
                            }
                          />
                          <DetailItem
                            label="Due Day"
                            value={lease.dueDay}
                          />
                          <DetailItem
                            label="Lease End"
                            value={formatDate(lease.endDate)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Maintenance & utility activity
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Recent issues, water bills, and meter readings for this unit.
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Recent issues</h4>
                    {unit.issues.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">No issues recorded.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {unit.issues.map((issue) => (
                          <div
                            key={issue.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                                  issue.status,
                                )}`}
                              >
                                {formatEnumLabel(issue.status)}
                              </span>
                              <span className="text-xs font-medium text-slate-500">
                                {formatEnumLabel(issue.priority)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-900">
                              {issue.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDateTime(issue.createdAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Recent water bills</h4>
                    {unit.waterBills.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">No water bills recorded.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {unit.waterBills.map((bill) => (
                          <div
                            key={bill.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                                  bill.status,
                                )}`}
                              >
                                {formatEnumLabel(bill.status)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-900">
                              {bill.period}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {formatCurrency(bill.total, currencyCode)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Due {formatDate(bill.dueDate)}
                              {bill.tenant?.fullName ? ` • ${bill.tenant.fullName}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Recent meter readings
                    </h4>
                    {unit.meterReadings.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-500">
                        No meter readings recorded.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {unit.meterReadings.map((reading) => (
                          <div
                            key={reading.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                                  reading.status,
                                )}`}
                              >
                                {formatEnumLabel(reading.status)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-900">
                              {reading.period}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {reading.prevReading} → {reading.currentReading}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Units used: {reading.unitsUsed}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>

            <aside className="space-y-8">
              <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Current snapshot
                </h3>
                <div className="mt-4 space-y-3">
                  <DetailItem
                    label="Current Lease"
                    value={
                      currentLease ? (
                        `${currentLease.tenant.fullName} (${formatEnumLabel(
                          currentLease.status,
                        )})`
                      ) : (
                        "No current lease"
                      )
                    }
                  />
                  <DetailItem
                    label="Latest Water Bill"
                    value={
                      latestWaterBill
                        ? `${latestWaterBill.period} • ${formatCurrency(
                            latestWaterBill.total,
                            currencyCode,
                          )}`
                        : "No recent bill"
                    }
                  />
                  <DetailItem
                    label="Latest Meter Reading"
                    value={
                      latestMeterReading
                        ? `${latestMeterReading.period} • ${latestMeterReading.unitsUsed} units`
                        : "No recent reading"
                    }
                  />
                  <DetailItem
                    label="Updated"
                    value={formatDateTime(unit.updatedAt)}
                  />
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  Generation source
                </h3>

                {unit.sourcePlan ? (
                  <div className="mt-4 space-y-3">
                    <DetailItem
                      label="Plan Label"
                      value={unit.sourcePlan.label || "—"}
                    />
                    <DetailItem
                      label="Plan Type"
                      value={formatUnitTypeLabel(
                        unit.sourcePlan.unitType,
                        unit.sourcePlan.bedrooms,
                      )}
                    />
                    <DetailItem
                      label="Quantity in Plan"
                      value={unit.sourcePlan.quantity}
                    />
                    <DetailItem
                      label="House Prefix"
                      value={unit.sourcePlan.houseNoPrefix || "—"}
                    />
                    <DetailItem
                      label="Start Number"
                      value={unit.sourcePlan.startNumber}
                    />
                    <DetailItem
                      label="Default Rent"
                      value={formatCurrency(
                        unit.sourcePlan.defaultRentAmount,
                        currencyCode,
                      )}
                    />
                    <DetailItem
                      label="Default Deposit"
                      value={
                        unit.sourcePlan.defaultDepositAmount
                          ? formatCurrency(
                              unit.sourcePlan.defaultDepositAmount,
                              currencyCode,
                            )
                          : "—"
                      }
                    />

                    {unit.sourcePlan.notes ? (
                      <div className="rounded-2xl bg-slate-50 px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Plan Notes
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {unit.sourcePlan.notes}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                    This unit was not linked to a stored property unit plan.
                  </div>
                )}
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}