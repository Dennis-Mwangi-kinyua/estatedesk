import { redirect } from "next/navigation";
import {
  BarChart3,
  Building2,
  ClipboardList,
  Home,
  Receipt,
  TrendingUp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { getCurrentPeriod } from "@/lib/ledger";

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
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function unitStatusTone(status: string) {
  switch (status) {
    case "OCCUPIED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "VACANT":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "RESERVED":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

function paymentStatusTone(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "PARTIAL":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
    case "UNPAID":
    case "OVERDUE":
      return "bg-red-50 text-red-700 ring-1 ring-red-200";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

export default async function LandlordDashboardPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    redirect("/login");
  }

  if (session.activeOrgRole !== "LANDLORD") {
    redirect("/dashboard");
  }

  const currentPeriod = getCurrentPeriod();

  const profile = await prisma.landlordProfile.findFirst({
    where: {
      orgId: session.activeOrgId,
      userId: session.userId,
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      displayName: true,
      assignments: {
        where: {
          active: true,
          endedAt: null,
        },
        select: {
          property: {
            select: {
              id: true,
              name: true,
              location: true,
              address: true,
              units: {
                where: {
                  deletedAt: null,
                  isActive: true,
                },
                select: {
                  id: true,
                  houseNo: true,
                  rentAmount: true,
                  status: true,
                  leases: {
                    where: {
                      deletedAt: null,
                      status: "ACTIVE",
                    },
                    select: {
                      id: true,
                      tenant: {
                        select: {
                          fullName: true,
                        },
                      },
                      rentCharges: {
                        where: {
                          period: currentPeriod,
                          chargeType: "RENT",
                        },
                        select: {
                          amountDue: true,
                          amountPaid: true,
                          balance: true,
                          status: true,
                        },
                        take: 1,
                      },
                    },
                    take: 1,
                  },
                },
                orderBy: {
                  houseNo: "asc",
                },
              },
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
                  location: true,
                  address: true,
                },
              },
              leases: {
                where: {
                  deletedAt: null,
                  status: "ACTIVE",
                },
                select: {
                  id: true,
                  tenant: {
                    select: {
                      fullName: true,
                    },
                  },
                  rentCharges: {
                    where: {
                      period: currentPeriod,
                      chargeType: "RENT",
                    },
                    select: {
                      amountDue: true,
                      amountPaid: true,
                      balance: true,
                      status: true,
                    },
                    take: 1,
                  },
                },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] p-4">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          No active landlord profile is linked to this account.
        </div>
      </div>
    );
  }

  const propertyMap = new Map<
    string,
    {
      id: string;
      name: string;
      location: string | null;
      address: string | null;
      units: Array<{
        id: string;
        houseNo: string;
        rentAmount: unknown;
        status: string;
        tenantName: string | null;
        paymentStatus: string;
        amountDue: unknown;
        amountPaid: unknown;
        balance: unknown;
      }>;
    }
  >();

  for (const assignment of profile.assignments) {
    if (assignment.property) {
      propertyMap.set(assignment.property.id, {
        id: assignment.property.id,
        name: assignment.property.name,
        location: assignment.property.location,
        address: assignment.property.address,
        units: assignment.property.units.map((unit) => ({
          amountDue: unit.leases[0]?.rentCharges[0]?.amountDue ?? unit.rentAmount,
          amountPaid: unit.leases[0]?.rentCharges[0]?.amountPaid ?? 0,
          balance: unit.leases[0]?.rentCharges[0]?.balance ?? unit.rentAmount,
          id: unit.id,
          houseNo: unit.houseNo,
          paymentStatus:
            unit.leases[0]?.rentCharges[0]?.status ??
            (unit.leases[0] ? "UNPAID" : "NO_TENANT"),
          rentAmount: unit.rentAmount,
          status: unit.status,
          tenantName: unit.leases[0]?.tenant.fullName ?? null,
        })),
      });
    }

    if (assignment.unit) {
      const property = assignment.unit.property;
      const existing =
        propertyMap.get(property.id) ??
        {
          id: property.id,
          name: property.name,
          location: property.location,
          address: property.address,
          units: [],
        };

      if (!existing.units.some((unit) => unit.id === assignment.unit?.id)) {
        existing.units.push({
          id: assignment.unit.id,
          amountDue:
            assignment.unit.leases[0]?.rentCharges[0]?.amountDue ??
            assignment.unit.rentAmount,
          amountPaid: assignment.unit.leases[0]?.rentCharges[0]?.amountPaid ?? 0,
          balance:
            assignment.unit.leases[0]?.rentCharges[0]?.balance ??
            assignment.unit.rentAmount,
          houseNo: assignment.unit.houseNo,
          paymentStatus:
            assignment.unit.leases[0]?.rentCharges[0]?.status ??
            (assignment.unit.leases[0] ? "UNPAID" : "NO_TENANT"),
          rentAmount: assignment.unit.rentAmount,
          status: assignment.unit.status,
          tenantName: assignment.unit.leases[0]?.tenant.fullName ?? null,
        });
      }

      propertyMap.set(property.id, existing);
    }
  }

  const properties = Array.from(propertyMap.values());
  const units = properties.flatMap((property) => property.units);
  const occupiedUnits = units.filter((unit) => unit.status === "OCCUPIED").length;
  const vacantUnits = units.filter((unit) => unit.status === "VACANT").length;
  const tenantNames = Array.from(
    new Set(units.map((unit) => unit.tenantName).filter(Boolean) as string[]),
  );
  const occupancyRate = units.length ? (occupiedUnits / units.length) * 100 : 0;
  const monthlyRent = units.reduce((total, unit) => total + Number(unit.rentAmount ?? 0), 0);
  const monthlyAmountDue = units
    .filter((unit) => unit.tenantName)
    .reduce((total, unit) => total + Number(unit.amountDue ?? 0), 0);
  const monthlyAmountPaid = units.reduce(
    (total, unit) => total + Number(unit.amountPaid ?? 0),
    0,
  );
  const monthlyBalance = units.reduce(
    (total, unit) => total + (unit.tenantName ? Number(unit.balance ?? 0) : 0),
    0,
  );
  const collectionRate = monthlyAmountDue
    ? (monthlyAmountPaid / monthlyAmountDue) * 100
    : 0;
  const paidUnits = units.filter(
    (unit) => unit.tenantName && Number(unit.balance ?? 0) <= 0,
  );
  const unpaidUnits = units.filter(
    (unit) => unit.tenantName && Number(unit.balance ?? 0) > 0,
  );
  const occupiedRent = units
    .filter((unit) => unit.status === "OCCUPIED")
    .reduce((total, unit) => total + Number(unit.rentAmount ?? 0), 0);
  const vacantRent = units
    .filter((unit) => unit.status === "VACANT")
    .reduce((total, unit) => total + Number(unit.rentAmount ?? 0), 0);
  const averageRent = units.length ? monthlyRent / units.length : 0;
  const strongestProperty = properties
    .map((property) => {
      const propertyRent = property.units.reduce(
        (total, unit) => total + Number(unit.rentAmount ?? 0),
        0,
      );

      return {
        name: property.name,
        rent: propertyRent,
        units: property.units.length,
      };
    })
    .sort((a, b) => b.rent - a.rent)[0];
  const propertyReports = properties.map((property) => {
    const expected = property.units
      .filter((unit) => unit.tenantName)
      .reduce((total, unit) => total + Number(unit.amountDue ?? 0), 0);
    const paid = property.units.reduce(
      (total, unit) => total + Number(unit.amountPaid ?? 0),
      0,
    );
    const balance = property.units.reduce(
      (total, unit) => total + (unit.tenantName ? Number(unit.balance ?? 0) : 0),
      0,
    );
    const paidCount = property.units.filter(
      (unit) => unit.tenantName && Number(unit.balance ?? 0) <= 0,
    ).length;
    const unpaidCount = property.units.filter(
      (unit) => unit.tenantName && Number(unit.balance ?? 0) > 0,
    ).length;

    return {
      id: property.id,
      name: property.name,
      expected,
      paid,
      balance,
      paidCount,
      unpaidCount,
    };
  });

  return (
    <div className="space-y-5">
        <section id="overview" className="ios-panel rounded-[28px] p-4 sm:p-5">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Landlord workspace
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                {profile.displayName}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                Monitor only the properties and units mapped to your landlord
                account, including occupancy, tenants, expected rent, received
                rent, and open balances for the current period.
              </p>
            </div>

            <div className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-neutral-500">
                    Collection rate
                  </p>
                  <p className="mt-1 text-3xl font-bold text-neutral-950">
                    {formatPercent(collectionRate)}
                  </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                  <BarChart3 className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white ring-1 ring-neutral-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(collectionRate, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                {formatCurrency(monthlyAmountPaid)} received from{" "}
                {formatCurrency(monthlyAmountDue)} expected.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Properties",
              value: properties.length.toLocaleString(),
              icon: Building2,
            },
            {
              label: "Units",
              value: units.length.toLocaleString(),
              icon: Home,
            },
            {
              label: "Occupied",
              value: occupiedUnits.toLocaleString(),
              icon: Users,
            },
            {
              label: "Total Monthly Income",
              value: formatCurrency(monthlyRent),
              icon: Receipt,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="ios-card rounded-[24px] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-neutral-500">
                      {item.label}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-neutral-950">
                      {item.value}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                </div>
              </div>
            );
          })}
        </section>

        <section id="reports" className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="ios-panel overflow-hidden rounded-[28px] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Reports
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-950">
                  Portfolio snapshot
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
                  Current period: {currentPeriod}. See expected income, received
                  rent, balances, and tenant payment status across every linked
                  property.
                </p>
              </div>

              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                <BarChart3 className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <ReportTile
                label="Mapped Rent"
                value={formatCurrency(monthlyRent)}
                detail={`${formatPercent(occupancyRate)} occupied · ${vacantUnits} vacant`}
                icon={TrendingUp}
              />
              <ReportTile
                label="Expected This Month"
                value={formatCurrency(monthlyAmountDue)}
                detail={`${tenantNames.length} active tenant${
                  tenantNames.length === 1 ? "" : "s"
                }`}
                icon={UserRoundCheck}
              />
              <ReportTile
                label="Paid This Month"
                value={formatCurrency(monthlyAmountPaid)}
                detail={`${paidUnits.length} tenant${
                  paidUnits.length === 1 ? "" : "s"
                } paid in full`}
                icon={Receipt}
              />
              <ReportTile
                label="Outstanding"
                value={formatCurrency(monthlyBalance)}
                detail={`${unpaidUnits.length} tenant${
                  unpaidUnits.length === 1 ? "" : "s"
                } not fully paid`}
                icon={Home}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <ReportTile
                label="Collection Rate"
                value={formatPercent(collectionRate)}
                detail={`${formatCurrency(monthlyAmountPaid)} collected this period`}
                icon={BarChart3}
              />
              <ReportTile
                label="Occupied Rent"
                value={formatCurrency(occupiedRent)}
                detail={`${occupiedUnits} occupied unit${
                  occupiedUnits === 1 ? "" : "s"
                }`}
                icon={Users}
              />
              <ReportTile
                label="Vacancy Exposure"
                value={formatCurrency(vacantRent)}
                detail={`${vacantUnits} vacant unit${
                  vacantUnits === 1 ? "" : "s"
                }`}
                icon={Building2}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <PaymentReportList
                title="Paid"
                emptyText="No tenants are fully paid for this period yet."
                units={paidUnits}
              />
              <PaymentReportList
                title="Not paid"
                emptyText="No unpaid tenant balances for this period."
                units={unpaidUnits}
              />
            </div>

            <div className="mt-4 rounded-[24px] border border-neutral-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-950">
                    Rent report
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {strongestProperty
                      ? `${strongestProperty.name} leads with ${formatCurrency(
                          strongestProperty.rent,
                        )} across ${strongestProperty.units} unit${
                          strongestProperty.units === 1 ? "" : "s"
                        }. Occupied rent is ${formatCurrency(
                          occupiedRent,
                        )}; average unit rent is ${formatCurrency(averageRent)}.`
                      : "No rent report is available yet."}
                  </p>
                </div>
                <div className="rounded-2xl bg-neutral-50 px-4 py-3 ring-1 ring-neutral-200">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                    Vacancy value
                  </p>
                  <p className="mt-1 text-base font-bold text-neutral-950">
                    {formatCurrency(vacantRent)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-950">
                    Property reports
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Breakdown for every property linked to this landlord.
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
                  {propertyReports.length} linked
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {propertyReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-semibold text-neutral-950">
                        {report.name}
                      </p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 ring-1 ring-neutral-200">
                        {report.paidCount}/{report.paidCount + report.unpaidCount} paid
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <PropertyMiniStat
                        label="Expected"
                        value={formatCurrency(report.expected)}
                      />
                      <PropertyMiniStat label="Paid" value={formatCurrency(report.paid)} />
                      <PropertyMiniStat
                        label="Balance"
                        value={formatCurrency(report.balance)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside id="tenants" className="ios-panel rounded-[28px] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Tenants
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-neutral-950">
                  Linked names
                </h2>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <ClipboardList className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {tenantNames.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-4 text-sm text-neutral-500">
                  Tenant names will appear here once occupied units have active
                  leases.
                </div>
              ) : (
                tenantNames.slice(0, 8).map((tenantName) => (
                  <div
                    key={tenantName}
                    className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-xs font-bold text-white">
                      {tenantName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase())
                        .join("") || "T"}
                    </span>
                    <p className="min-w-0 truncate text-sm font-semibold text-neutral-950">
                      {tenantName}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>

        <section id="properties" className="space-y-4">
          {properties.length === 0 ? (
            <div className="ios-card rounded-[28px] p-8 text-center text-sm text-neutral-500">
              No properties have been linked to this landlord account yet.
            </div>
          ) : (
            properties.map((property) => (
              <article key={property.id} className="ios-card rounded-[28px] p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-950">
                      {property.name}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-500">
                      {[property.location, property.address].filter(Boolean).join(" - ") ||
                        "No location added"}
                    </p>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                    {property.units.length} unit{property.units.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-4 rounded-[24px] border border-neutral-200 bg-neutral-50 p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        Tenants in this property
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {property.units.some((unit) => unit.tenantName) ? (
                          property.units
                            .filter((unit) => unit.tenantName)
                            .map((unit) => (
                              <span
                                key={`${property.id}-${unit.id}-tenant`}
                                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200"
                              >
                                {unit.tenantName} · Unit {unit.houseNo}
                              </span>
                            ))
                        ) : (
                          <span className="text-sm text-neutral-500">
                            No active tenants linked yet.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[260px]">
                      <PropertyMiniStat
                        label="Units"
                        value={property.units.length.toLocaleString()}
                      />
                      <PropertyMiniStat
                        label="Occupied"
                        value={property.units
                          .filter((unit) => unit.status === "OCCUPIED")
                          .length.toLocaleString()}
                      />
                      <PropertyMiniStat
                        label="Rent"
                        value={formatCurrency(
                          property.units.reduce(
                            (total, unit) => total + Number(unit.rentAmount ?? 0),
                            0,
                          ),
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {property.units.map((unit) => (
                    <div
                      key={unit.id}
                      className="rounded-2xl border border-neutral-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">
                            Unit {unit.houseNo}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {unit.tenantName ?? "Vacant"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${unitStatusTone(
                            unit.status,
                          )}`}
                        >
                          {unit.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm font-semibold text-neutral-950">
                        {formatCurrency(unit.rentAmount)}
                      </p>
                      {unit.tenantName ? (
                        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-3 py-2 ring-1 ring-neutral-200">
                          <div>
                            <p className="text-[11px] font-medium text-neutral-500">
                              {currentPeriod} balance
                            </p>
                            <p className="mt-0.5 text-sm font-bold text-neutral-950">
                              {formatCurrency(unit.balance)}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${paymentStatusTone(
                              unit.paymentStatus,
                            )}`}
                          >
                            {Number(unit.balance ?? 0) <= 0 ? "PAID" : unit.paymentStatus}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ))
          )}
        </section>

    </div>
  );
}

function ReportTile({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof BarChart3;
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-neutral-500">{label}</p>
          <p className="mt-1 truncate text-xl font-bold text-neutral-950">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-50 text-neutral-800 ring-1 ring-neutral-200">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-neutral-500">{detail}</p>
    </div>
  );
}

function PropertyMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2 ring-1 ring-neutral-200">
      <p className="truncate text-[11px] font-medium text-neutral-500">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-neutral-950">{value}</p>
    </div>
  );
}

function PaymentReportList({
  title,
  emptyText,
  units,
}: {
  title: string;
  emptyText: string;
  units: Array<{
    houseNo: string;
    tenantName: string | null;
    amountPaid: unknown;
    balance: unknown;
    paymentStatus: string;
  }>;
}) {
  return (
    <div className="rounded-[24px] border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-neutral-950">{title}</p>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
          {units.length}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {units.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-500">
            {emptyText}
          </p>
        ) : (
          units.slice(0, 6).map((unit) => (
            <div
              key={`${title}-${unit.houseNo}-${unit.tenantName}`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-3 py-3 ring-1 ring-neutral-200"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-neutral-950">
                  {unit.tenantName}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Unit {unit.houseNo} · Paid {formatCurrency(unit.amountPaid)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${paymentStatusTone(
                  unit.paymentStatus,
                )}`}
              >
                {Number(unit.balance ?? 0) <= 0
                  ? "PAID"
                  : formatCurrency(unit.balance)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
