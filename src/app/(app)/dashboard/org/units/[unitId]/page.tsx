import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";

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

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
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
    case "RESOLVED":
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "VACANT":
    case "PENDING":
    case "ISSUED":
    case "SUBMITTED":
    case "IN_PROGRESS":
    case "PAYMENT_PENDING":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "OVERDUE":
    case "FAILED":
    case "REJECTED":
    case "CANCELLED":
    case "TERMINATED":
    case "CLOSED":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    case "UNDER_MAINTENANCE":
      return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
        status,
      )}`}
    >
      {formatLabel(status)}
    </span>
  );
}

function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: ReactNode;
  helper?: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
      {helper ? <p className="mt-1 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
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

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export default async function UnitDetailsPage({ params }: PageProps) {
  const session = await requireManagementAccess();
  const { unitId } = await params;

  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      deletedAt: null,
      property: {
        orgId: session.activeOrgId!,
        deletedAt: null,
      },
    },
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
        orderBy: [{ status: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
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

  if (!unit) {
    notFound();
  }

  const activeLease =
    unit.leases.find((lease) => lease.status === "ACTIVE") ?? unit.leases[0] ?? null;

  const latestReading = unit.meterReadings[0] ?? null;
  const latestWaterBill = unit.waterBills[0] ?? null;

  return (
    <div className="min-h-screen bg-[#f2f2f7]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <section className="flex flex-col gap-4 rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard/org/units"
                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                >
                  Units
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Details
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Unit {unit.houseNo}
                </h1>
                <StatusBadge status={unit.status} />
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

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                {formatLabel(unit.type)} in <span className="font-semibold text-slate-900">{unit.property.name}</span>
                {unit.building ? (
                  <>
                    {" "}• Building <span className="font-semibold text-slate-900">{unit.building.name}</span>
                  </>
                ) : null}
                {unit.property.location || unit.property.address ? (
                  <>
                    {" "}• {unit.property.location || unit.property.address}
                  </>
                ) : null}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/org/units"
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Units
              </Link>
              <Link
                href={`/dashboard/org/properties/${unit.property.id}`}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View Property
              </Link>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Monthly Rent" value={formatCurrency(unit.rentAmount)} />
            <StatCard label="Deposit" value={formatCurrency(unit.depositAmount)} />
            <StatCard label="Occupancy" value={activeLease ? activeLease.tenant.fullName : "Vacant"} helper={activeLease ? `Lease ${formatLabel(activeLease.status)}` : "No active lease"} />
            <StatCard label="Latest Water Bill" value={latestWaterBill ? formatCurrency(latestWaterBill.total) : "—"} helper={latestWaterBill ? `Due ${formatDate(latestWaterBill.dueDate)}` : "No recent bill"} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div className="space-y-6">
              <SectionCard
                title="Unit overview"
                subtitle="Core details and operational status for this unit."
              >
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <DetailCard label="House Number" value={unit.houseNo} />
                  <DetailCard label="Unit Type" value={formatLabel(unit.type)} />
                  <DetailCard label="Status" value={<StatusBadge status={unit.status} />} />
                  <DetailCard label="Bedrooms" value={unit.bedrooms ?? "—"} />
                  <DetailCard label="Bathrooms" value={unit.bathrooms ?? "—"} />
                  <DetailCard label="Floor Area" value={unit.floorArea ? `${unit.floorArea} sqm` : "—"} />
                  <DetailCard label="Vacant Since" value={formatDate(unit.vacantSince)} />
                  <DetailCard label="Property Type" value={formatLabel(unit.property.type)} />
                  <DetailCard label="Building" value={unit.building?.name || "No building assigned"} />
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Notes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {unit.notes?.trim() || "No notes added for this unit yet."}
                  </p>
                </div>
              </SectionCard>

              <SectionCard
                title="Lease history"
                subtitle="Most recent lease records associated with this unit."
              >
                {unit.leases.length === 0 ? (
                  <EmptyState
                    title="No leases found"
                    description="Lease activity for this unit will appear here once a tenant is assigned."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead>
                        <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          <th className="pb-3 pr-4">Tenant</th>
                          <th className="pb-3 pr-4">Status</th>
                          <th className="pb-3 pr-4">Start</th>
                          <th className="pb-3 pr-4">End</th>
                          <th className="pb-3 pr-0 text-right">Monthly Rent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {unit.leases.map((lease) => (
                          <tr key={lease.id} className="align-top">
                            <td className="py-4 pr-4">
                              <div className="font-medium text-slate-900">{lease.tenant.fullName}</div>
                              <div className="mt-1 text-sm text-slate-500">{lease.tenant.phone}</div>
                              <div className="text-sm text-slate-500">{lease.tenant.email || "No email"}</div>
                            </td>
                            <td className="py-4 pr-4"><StatusBadge status={lease.status} /></td>
                            <td className="py-4 pr-4 text-sm text-slate-600">{formatDate(lease.startDate)}</td>
                            <td className="py-4 pr-4 text-sm text-slate-600">{formatDate(lease.endDate)}</td>
                            <td className="py-4 pr-0 text-right text-sm font-semibold text-slate-900">{formatCurrency(lease.monthlyRent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Operations"
                subtitle="Recent issues, meter readings, and billing activity."
              >
                <div className="grid gap-6 xl:grid-cols-3">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Recent issues</h3>
                      <p className="mt-1 text-sm text-slate-500">Latest maintenance or operational tickets.</p>
                    </div>
                    {unit.issues.length === 0 ? (
                      <EmptyState
                        title="No issues logged"
                        description="Open tickets connected to this unit will appear here."
                      />
                    ) : (
                      <div className="space-y-3">
                        {unit.issues.map((issue) => (
                          <div key={issue.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="font-medium text-slate-900">{issue.title}</p>
                              <StatusBadge status={issue.status} />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                                Priority: {formatLabel(issue.priority)}
                              </span>
                              <span>Created {formatDate(issue.createdAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Meter readings</h3>
                      <p className="mt-1 text-sm text-slate-500">Most recent water consumption snapshots.</p>
                    </div>
                    {unit.meterReadings.length === 0 ? (
                      <EmptyState
                        title="No readings submitted"
                        description="Water meter readings for this unit will appear here."
                      />
                    ) : (
                      <div className="space-y-3">
                        {unit.meterReadings.map((reading) => (
                          <div key={reading.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="font-medium text-slate-900">Period {reading.period}</p>
                              <StatusBadge status={reading.status} />
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-slate-400">Previous</p>
                                <p className="mt-1 font-medium text-slate-700">{reading.prevReading}</p>
                              </div>
                              <div>
                                <p className="text-slate-400">Current</p>
                                <p className="mt-1 font-medium text-slate-700">{reading.currentReading}</p>
                              </div>
                              <div>
                                <p className="text-slate-400">Used</p>
                                <p className="mt-1 font-medium text-slate-700">{reading.unitsUsed}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Water bills</h3>
                      <p className="mt-1 text-sm text-slate-500">Recent billing records generated for this unit.</p>
                    </div>
                    {unit.waterBills.length === 0 ? (
                      <EmptyState
                        title="No bills generated"
                        description="Water bills for this unit will appear once billing is recorded."
                      />
                    ) : (
                      <div className="space-y-3">
                        {unit.waterBills.map((bill) => (
                          <div key={bill.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p className="font-medium text-slate-900">Period {bill.period}</p>
                              <StatusBadge status={bill.status} />
                            </div>
                            <div className="mt-3 flex items-end justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Units Used</p>
                                <p className="mt-1 text-sm font-medium text-slate-700">{bill.unitsUsed}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Amount</p>
                                <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(bill.total)}</p>
                                <p className="mt-1 text-xs text-slate-500">Due {formatDate(bill.dueDate)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </SectionCard>
            </div>

            <div className="space-y-6">
              <SectionCard
                title="Current occupancy"
                subtitle="Snapshot of the current tenant and lease status."
              >
                {activeLease ? (
                  <div className="rounded-[24px] bg-slate-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-500">Current tenant</p>
                        <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                          {activeLease.tenant.fullName}
                        </p>
                      </div>
                      <StatusBadge status={activeLease.status} />
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <p>{activeLease.tenant.phone}</p>
                      <p>{activeLease.tenant.email || "No email address"}</p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <DetailCard label="Lease Start" value={formatDate(activeLease.startDate)} />
                      <DetailCard label="Lease End" value={formatDate(activeLease.endDate)} />
                      <DetailCard label="Due Day" value={activeLease.dueDay} />
                      <DetailCard label="Monthly Rent" value={formatCurrency(activeLease.monthlyRent)} />
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No active occupancy"
                    description="This unit currently has no active lease or tenant assigned."
                  />
                )}
              </SectionCard>

              <SectionCard
                title="Property context"
                subtitle="Parent property and location information."
              >
                <div className="grid gap-4">
                  <DetailCard label="Property" value={unit.property.name} />
                  <DetailCard label="Property Type" value={formatLabel(unit.property.type)} />
                  <DetailCard label="Location" value={unit.property.location || "—"} />
                  <DetailCard label="Address" value={unit.property.address || "—"} />
                  <DetailCard label="Building" value={unit.building?.name || "No building assigned"} />
                </div>
              </SectionCard>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
