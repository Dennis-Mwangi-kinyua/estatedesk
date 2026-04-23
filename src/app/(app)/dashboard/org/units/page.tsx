import Link from "next/link";
import type { ReactNode } from "react";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type UnitsPageSearchParams = {
  q?: string;
  status?: string;
  activity?: string;
  page?: string;
};

type UnitsPageProps = {
  searchParams?: Promise<UnitsPageSearchParams> | UnitsPageSearchParams;
};

type UnitStatusFilter =
  | "ALL"
  | "OCCUPIED"
  | "VACANT"
  | "RESERVED"
  | "UNDER_MAINTENANCE"
  | "INACTIVE";

type ActivityFilter = "ALL" | "ACTIVE" | "INACTIVE";

function formatCurrency(value: unknown, currencyCode = "KES") {
  const amount =
    typeof value === "object" && value !== null && "toNumber" in value
      ? (value as { toNumber: () => number }).toNumber()
      : Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
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

function normalizeQuery(value?: string) {
  return value?.trim() ?? "";
}

function parseStatusFilter(value?: string): UnitStatusFilter {
  const allowed: UnitStatusFilter[] = [
    "ALL",
    "OCCUPIED",
    "VACANT",
    "RESERVED",
    "UNDER_MAINTENANCE",
    "INACTIVE",
  ];

  return allowed.includes((value ?? "ALL") as UnitStatusFilter)
    ? ((value ?? "ALL") as UnitStatusFilter)
    : "ALL";
}

function parseActivityFilter(value?: string): ActivityFilter {
  const allowed: ActivityFilter[] = ["ALL", "ACTIVE", "INACTIVE"];

  return allowed.includes((value ?? "ALL") as ActivityFilter)
    ? ((value ?? "ALL") as ActivityFilter)
    : "ALL";
}

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildPageHref(params: {
  page: number;
  q?: string;
  status?: string;
  activity?: string;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.status && params.status !== "ALL") search.set("status", params.status);
  if (params.activity && params.activity !== "ALL") {
    search.set("activity", params.activity);
  }
  if (params.page > 1) search.set("page", String(params.page));

  const qs = search.toString();
  return qs ? `/dashboard/org/units?${qs}` : "/dashboard/org/units";
}

export default async function UnitsPage({ searchParams }: UnitsPageProps) {
  const session = await requireManagementAccess();

  if (!session.activeOrgId) {
    redirect("/dashboard");
  }

  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<UnitsPageSearchParams>).then === "function"
      ? await (searchParams as Promise<UnitsPageSearchParams>)
      : (searchParams as UnitsPageSearchParams | undefined) ?? {};

  const q = normalizeQuery(resolvedSearchParams.q);
  const status = parseStatusFilter(resolvedSearchParams.status);
  const activity = parseActivityFilter(resolvedSearchParams.activity);
  const requestedPage = parsePage(resolvedSearchParams.page);

  const scopeWhere: Prisma.UnitWhereInput =
    session.membershipScope?.scopeType === "PROPERTY"
      ? {
          propertyId: session.membershipScope.scopeId,
        }
      : session.membershipScope?.scopeType === "BUILDING"
        ? {
            buildingId: session.membershipScope.scopeId,
          }
        : session.membershipScope?.scopeType === "UNIT"
          ? {
              id: session.membershipScope.scopeId,
            }
          : {};

  const baseWhere: Prisma.UnitWhereInput = {
    deletedAt: null,
    property: {
      is: {
        orgId: session.activeOrgId,
        deletedAt: null,
      },
    },
    ...scopeWhere,
  };

  const filteredWhere: Prisma.UnitWhereInput = {
    ...baseWhere,
    ...(status !== "ALL" ? { status } : {}),
    ...(activity === "ACTIVE"
      ? { isActive: true }
      : activity === "INACTIVE"
        ? { isActive: false }
        : {}),
    ...(q
      ? {
          OR: [
            { houseNo: { contains: q, mode: "insensitive" } },
            {
              property: {
                is: {
                  name: { contains: q, mode: "insensitive" },
                },
              },
            },
            {
              property: {
                is: {
                  location: { contains: q, mode: "insensitive" },
                },
              },
            },
            {
              property: {
                is: {
                  address: { contains: q, mode: "insensitive" },
                },
              },
            },
            {
              building: {
                is: {
                  name: { contains: q, mode: "insensitive" },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [
    organization,
    totalUnits,
    activeUnits,
    occupiedUnits,
    vacantUnits,
    filteredTotal,
  ] = await Promise.all([
    prisma.organization.findFirst({
      where: {
        id: session.activeOrgId,
        deletedAt: null,
      },
      select: {
        currencyCode: true,
      },
    }),
    prisma.unit.count({ where: baseWhere }),
    prisma.unit.count({
      where: {
        ...baseWhere,
        isActive: true,
      },
    }),
    prisma.unit.count({
      where: {
        ...baseWhere,
        status: "OCCUPIED",
      },
    }),
    prisma.unit.count({
      where: {
        ...baseWhere,
        status: "VACANT",
      },
    }),
    prisma.unit.count({
      where: filteredWhere,
    }),
  ]);

  const currencyCode = organization?.currencyCode ?? "KES";
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const units = await prisma.unit.findMany({
    where: filteredWhere,
    orderBy: [
      { property: { name: "asc" } },
      { building: { name: "asc" } },
      { houseNo: "asc" },
    ],
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      houseNo: true,
      type: true,
      bedrooms: true,
      bathrooms: true,
      rentAmount: true,
      status: true,
      isActive: true,
      property: {
        select: {
          id: true,
          name: true,
          location: true,
          address: true,
        },
      },
      building: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const groupedProperties = Object.values(
    units.reduce<
      Record<
        string,
        {
          property: (typeof units)[number]["property"];
          units: typeof units;
        }
      >
    >((acc, unit) => {
      const propertyId = unit.property.id;

      if (!acc[propertyId]) {
        acc[propertyId] = {
          property: unit.property,
          units: [],
        };
      }

      acc[propertyId].units.push(unit);
      return acc;
    }, {}),
  );

  const filteredOccupied = units.filter((unit) => unit.status === "OCCUPIED").length;
  const filteredVacant = units.filter((unit) => unit.status === "VACANT").length;
  const filteredActive = units.filter((unit) => unit.isActive).length;
  const hasFilters = Boolean(q) || status !== "ALL" || activity !== "ALL";

  const showingFrom = filteredTotal === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredTotal);

  const prevHref = buildPageHref({
    page: currentPage - 1,
    q: q || undefined,
    status,
    activity,
  });

  const nextHref = buildPageHref({
    page: currentPage + 1,
    q: q || undefined,
    status,
    activity,
  });

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
                Units
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Search, filter, and review units across all properties from one
                clean management view.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/org/properties"
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                View Properties
              </Link>
              <Link
                href="/dashboard/org/buildings"
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                View Buildings
              </Link>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard title="Total Units" value={totalUnits} subtitle="Across all properties" />
            <StatCard title="Active Units" value={activeUnits} subtitle="Currently enabled" />
            <StatCard title="Occupied" value={occupiedUnits} subtitle="Portfolio wide" />
            <StatCard title="Vacant" value={vacantUnits} subtitle="Ready to fill" />
          </section>

          <section className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_200px_auto] lg:items-end">
              <div>
                <label
                  htmlFor="units-search"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Search units
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      fill="none"
                      className="h-5 w-5"
                    >
                      <path
                        d="M14.5 14.5L18 18M16.4 9.2A7.2 7.2 0 112 9.2a7.2 7.2 0 0114.4 0z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    id="units-search"
                    name="q"
                    defaultValue={q}
                    placeholder="Search by unit number, property, building, or location"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={status}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="ALL">All statuses</option>
                  <option value="OCCUPIED">Occupied</option>
                  <option value="VACANT">Vacant</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="UNDER_MAINTENANCE">Under maintenance</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="activity"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Availability
                </label>
                <select
                  id="activity"
                  name="activity"
                  defaultValue={activity}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="ALL">All</option>
                  <option value="ACTIVE">Active only</option>
                  <option value="INACTIVE">Inactive only</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Apply
                </button>
                <Link
                  href="/dashboard/org/units"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </Link>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Showing {showingFrom}-{showingTo} of {filteredTotal}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  Active: {filteredActive}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  Occupied: {filteredOccupied}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                  Vacant: {filteredVacant}
                </span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                  Properties on page: {groupedProperties.length}
                </span>
              </div>

              {hasFilters ? (
                <p className="text-sm text-slate-500">
                  Filtered results based on your current search.
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  Use search and filters to narrow large portfolios quickly.
                </p>
              )}
            </div>
          </section>

          {groupedProperties.length === 0 ? (
            <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">
                No matching units found
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Try adjusting your search or filters.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/dashboard/org/units"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear Filters
                </Link>
                <Link
                  href="/dashboard/org/properties"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  View Properties
                </Link>
              </div>
            </section>
          ) : (
            <>
              <div className="space-y-8">
                {groupedProperties.map(({ property, units: propertyUnits }) => {
                  const propertyOccupied = propertyUnits.filter(
                    (unit) => unit.status === "OCCUPIED",
                  ).length;
                  const propertyVacant = propertyUnits.filter(
                    (unit) => unit.status === "VACANT",
                  ).length;

                  return (
                    <section
                      key={property.id}
                      className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-sm"
                    >
                      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/75 sm:px-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-xl font-semibold tracking-tight text-slate-900">
                                {property.name}
                              </h2>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {propertyUnits.length}{" "}
                                {propertyUnits.length === 1 ? "unit" : "units"}
                              </span>
                            </div>

                            <p className="mt-1 truncate text-sm text-slate-500">
                              {property.location || property.address || "No location provided"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                              Occupied: {propertyOccupied}
                            </span>
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                              Vacant: {propertyVacant}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {propertyUnits.map((unit) => (
                            <article
                              key={unit.id}
                              className="rounded-[26px] border border-slate-200 bg-[#fbfbfd] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <Link
                                    href={`/dashboard/org/units/${unit.id}`}
                                    className="block truncate text-lg font-semibold text-slate-900 hover:text-slate-700"
                                  >
                                    Unit {unit.houseNo}
                                  </Link>

                                  <p className="mt-1 text-sm text-slate-500">
                                    {unit.building ? unit.building.name : "No building"}
                                  </p>
                                </div>

                                <span
                                  className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${statusClasses(
                                    unit.status,
                                  )}`}
                                >
                                  {formatEnumLabel(unit.status)}
                                </span>
                              </div>

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <DetailItem
                                  label="Type"
                                  value={formatUnitTypeLabel(unit.type, unit.bedrooms)}
                                />
                                <DetailItem
                                  label="Rent"
                                  value={
                                    <span className="font-semibold text-slate-900">
                                      {formatCurrency(unit.rentAmount, currencyCode)}
                                    </span>
                                  }
                                />
                                <DetailItem label="Bedrooms" value={unit.bedrooms ?? "—"} />
                                <DetailItem label="Bathrooms" value={unit.bathrooms ?? "—"} />
                              </div>

                              <div className="mt-4 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                  Availability
                                </p>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-sm font-medium text-slate-600">
                                    Active
                                  </span>
                                  <span
                                    className={`text-sm font-semibold ${
                                      unit.isActive ? "text-emerald-700" : "text-slate-500"
                                    }`}
                                  >
                                    {unit.isActive ? "Yes" : "No"}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-4 flex gap-3">
                                <Link
                                  href={`/dashboard/org/units/${unit.id}`}
                                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                  View Unit
                                </Link>

                                <Link
                                  href="/dashboard/org/properties"
                                  className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  Properties
                                </Link>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>

              <section className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="text-sm text-slate-500">
                  Showing {showingFrom}-{showingTo} of {filteredTotal} matching units
                </div>

                <div className="flex items-center gap-3">
                  {currentPage > 1 ? (
                    <Link
                      href={prevHref}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-400">
                      Previous
                    </span>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
                    {currentPage} / {totalPages}
                  </div>

                  {currentPage < totalPages ? (
                    <Link
                      href={nextHref}
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="inline-flex h-11 cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-400">
                      Next
                    </span>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}