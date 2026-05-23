import Link from "next/link";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Prisma, PropertyType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

const PAGE_SIZE = 8;

const PROPERTY_TYPES: Array<{ value: PropertyType; label: string }> = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "MIXED_USE", label: "Mixed use" },
  { value: "GODOWN", label: "Godown" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active only" },
  { value: "inactive", label: "Inactive only" },
] as const;

const getCurrentOrgContext = cache(async function getCurrentOrgContext() {
  const session = await requireUserSession();

  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      orgId: session.activeOrgId ?? undefined,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      orgId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      },
    },
  });

  if (membership) return membership;

  const fallbackMembership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      role: {
        in: ["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"],
      },
      org: {
        deletedAt: null,
        status: "ACTIVE",
      },
      user: {
        deletedAt: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      orgId: true,
      role: true,
      org: {
        select: {
          id: true,
          name: true,
          slug: true,
          currencyCode: true,
          timezone: true,
        },
      },
    },
  });

  if (!fallbackMembership) redirect("/dashboard");

  return fallbackMembership;
});

type SearchParams = Promise<{
  created?: string;
  q?: string;
  type?: string;
  status?: string;
  page?: string;
}>;

function formatPropertyType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMoney(
  value: string | number | null | undefined,
  currencyCode: string,
) {
  if (value === null || value === undefined) return "—";

  const amount =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  if (Number.isNaN(amount)) return "—";

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(value);
}

function toPositiveInt(value?: string) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildPageHref(params: {
  page: number;
  q?: string;
  type?: string;
  status?: string;
  created?: string;
}) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.type && params.type !== "all") search.set("type", params.type);
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.created) search.set("created", params.created);
  if (params.page > 1) search.set("page", String(params.page));

  const qs = search.toString();
  return qs ? `/dashboard/org/properties?${qs}` : "/dashboard/org/properties";
}

export default async function OrgPropertiesPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const membership = await getCurrentOrgContext();
  const params = (await searchParams) ?? {};

  const created = params.created === "1";
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const type =
    typeof params.type === "string" &&
    PROPERTY_TYPES.some((item) => item.value === params.type)
      ? params.type
      : "all";
  const status =
    typeof params.status === "string" &&
    STATUS_OPTIONS.some((item) => item.value === params.status)
      ? params.status
      : "all";

  const currentPage = toPositiveInt(params.page);

  const where: Prisma.PropertyWhereInput = {
    orgId: membership.orgId,
    deletedAt: null,
  };

  if (query) {
    where.OR = [
      {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        location: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        address: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        notes: {
          contains: query,
          mode: "insensitive",
        },
      },
      {
        taxpayerProfile: {
          is: {
            displayName: {
              contains: query,
              mode: "insensitive",
            },
          },
        },
      },
      {
        taxpayerProfile: {
          is: {
            kraPin: {
              contains: query,
              mode: "insensitive",
            },
          },
        },
      },
    ];
  }

  if (type !== "all") {
    where.type = type as PropertyType;
  }

  if (status === "active") {
    where.isActive = true;
  }

  if (status === "inactive") {
    where.isActive = false;
  }

  const [
    overallProperties,
    activeProperties,
    totalBuildingsAggregate,
    totalUnitsAggregate,
    filteredTotal,
    properties,
  ] = await Promise.all([
    prisma.property.count({
      where: {
        orgId: membership.orgId,
        deletedAt: null,
      },
    }),

    prisma.property.count({
      where: {
        orgId: membership.orgId,
        deletedAt: null,
        isActive: true,
      },
    }),

    prisma.building.count({
      where: {
        deletedAt: null,
        property: {
          orgId: membership.orgId,
          deletedAt: null,
        },
      },
    }),

    prisma.unit.count({
      where: {
        deletedAt: null,
        property: {
          orgId: membership.orgId,
          deletedAt: null,
        },
      },
    }),

    prisma.property.count({ where }),

    prisma.property.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        type: true,
        location: true,
        address: true,
        notes: true,
        isActive: true,
        waterRatePerUnit: true,
        waterFixedCharge: true,
        createdAt: true,
        taxpayerProfile: {
          select: {
            id: true,
            displayName: true,
            kraPin: true,
            kind: true,
          },
        },
        _count: {
          select: {
            buildings: true,
            units: true,
            issues: true,
          },
        },
      },
    }),
  ]);

  const inactiveProperties = overallProperties - activeProperties;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const showingFrom = filteredTotal === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safeCurrentPage * PAGE_SIZE, filteredTotal);
  const hasFilters = Boolean(query) || type !== "all" || status !== "all";

  const prevHref = buildPageHref({
    page: safeCurrentPage - 1,
    q: query || undefined,
    type,
    status,
    created: created ? "1" : undefined,
  });

  const nextHref = buildPageHref({
    page: safeCurrentPage + 1,
    q: query || undefined,
    type,
    status,
    created: created ? "1" : undefined,
  });

  const clearFiltersHref = buildPageHref({
    page: 1,
    created: created ? "1" : undefined,
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                Property management
              </div>

              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
                Property portfolio
              </h1>

              <p className="mt-3 text-sm leading-6 text-neutral-600 sm:text-base">
                Manage all properties under{" "}
                <span className="font-medium">{membership.org.name}</span>. Review
                portfolio coverage, water billing defaults, linked taxpayer profiles,
                and the number of buildings and units assigned to each property.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/org"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
              >
                Back to dashboard
              </Link>

              <Link
                href="/dashboard/org/properties/new"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                New property
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 py-5 sm:grid-cols-4 sm:px-6">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Total properties
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">
              {overallProperties}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Active
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">
              {activeProperties}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Buildings
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">
              {totalBuildingsAggregate}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              Units
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-950">
              {totalUnitsAggregate}
            </p>
          </div>
        </div>
      </section>

      {created ? (
        <section className="rounded-3xl border border-green-200 bg-green-50 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-green-900">
                Property created successfully
              </h2>
              <p className="mt-1 text-sm text-green-800">
                Your new property is now available for buildings, units, tenants,
                billing, and portfolio reporting.
              </p>
            </div>

            <Link
              href="/dashboard/org/properties/new"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Create another
            </Link>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                All properties
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                {overallProperties} {overallProperties === 1 ? "property" : "properties"} in
                this organization
                {inactiveProperties > 0 ? `, including ${inactiveProperties} inactive` : ""}
                .
              </p>
            </div>

            <form
              method="get"
              className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]"
            >
              {created ? <input type="hidden" name="created" value="1" /> : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">
                  Search
                </span>
                <input
                  name="q"
                  defaultValue={query}
                  type="search"
                  placeholder="Search by name, location, address, notes, PIN..."
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">
                  Type
                </span>
                <select
                  name="type"
                  defaultValue={type}
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                >
                  <option value="all">All types</option>
                  {PROPERTY_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-neutral-700">
                  Status
                </span>
                <select
                  name="status"
                  defaultValue={status}
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-white px-4 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-100"
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 lg:w-auto"
                >
                  Apply
                </button>

                {hasFilters ? (
                  <Link
                    href={clearFiltersHref}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl border border-neutral-200 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 lg:w-auto"
                  >
                    Clear
                  </Link>
                ) : null}
              </div>
            </form>
          </div>
        </div>

        <div className="border-b border-neutral-200 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-600">
              Showing{" "}
              <span className="font-medium text-neutral-900">{showingFrom}</span>
              {" "}-{" "}
              <span className="font-medium text-neutral-900">{showingTo}</span>
              {" "}of{" "}
              <span className="font-medium text-neutral-900">{filteredTotal}</span>
              {" "}matching {filteredTotal === 1 ? "property" : "properties"}.
            </p>

            <p className="text-sm text-neutral-500">
              Page {safeCurrentPage} of {totalPages}
            </p>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="px-5 py-16 text-center sm:px-6">
            <div className="mx-auto max-w-md">
              <h3 className="text-lg font-semibold text-neutral-950">
                {hasFilters ? "No matching properties" : "No properties yet"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {hasFilters
                  ? "Try adjusting your search terms or filters to find what you are looking for."
                  : "Start by creating your first property. Once added, you can attach buildings, units, caretaker assignments, leases, and billing flows."}
              </p>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {hasFilters ? (
                  <Link
                    href={clearFiltersHref}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-neutral-200 px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Clear filters
                  </Link>
                ) : null}

                <Link
                  href="/dashboard/org/properties/new"
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Create property
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-neutral-200">
              {properties.map((property) => (
                <article key={property.id} className="px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-5 xl:grid xl:grid-cols-12 xl:gap-6">
                    <div className="xl:col-span-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold text-neutral-950">
                            {property.name}
                          </h3>
                          <p className="mt-1 text-sm text-neutral-500">
                            {formatPropertyType(property.type)}
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                            property.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {property.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-neutral-600">
                        <p>
                          <span className="font-medium text-neutral-800">Location:</span>{" "}
                          {property.location || "—"}
                        </p>
                        <p>
                          <span className="font-medium text-neutral-800">Address:</span>{" "}
                          {property.address || "—"}
                        </p>
                        <p>
                          <span className="font-medium text-neutral-800">Created:</span>{" "}
                          {formatDate(property.createdAt)}
                        </p>
                      </div>

                      {property.notes ? (
                        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Notes
                          </p>
                          <p className="mt-2 text-sm leading-6 text-neutral-700">
                            {property.notes}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="xl:col-span-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                        Taxpayer profile
                      </p>

                      {property.taxpayerProfile ? (
                        <div className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                          <p className="text-sm font-semibold text-neutral-900">
                            {property.taxpayerProfile.displayName}
                          </p>
                          <p className="mt-1 text-sm text-neutral-600">
                            PIN: {property.taxpayerProfile.kraPin}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-neutral-500">
                            {property.taxpayerProfile.kind}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2 rounded-2xl border border-dashed border-neutral-200 p-4 text-sm text-neutral-500">
                          No taxpayer profile linked
                        </div>
                      )}
                    </div>

                    <div className="xl:col-span-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                        Water billing defaults
                      </p>

                      <div className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Rate per unit
                          </p>
                          <p className="mt-2 text-sm font-medium text-neutral-900">
                            {formatMoney(
                              property.waterRatePerUnit?.toString(),
                              membership.org.currencyCode,
                            )}
                          </p>
                        </div>

                        <div className="mt-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Fixed charge
                          </p>
                          <p className="mt-2 text-sm font-medium text-neutral-900">
                            {formatMoney(
                              property.waterFixedCharge?.toString(),
                              membership.org.currencyCode,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="xl:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
                        Portfolio stats
                      </p>

                      <div className="mt-2 grid grid-cols-3 gap-3 xl:grid-cols-1">
                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Buildings
                          </p>
                          <p className="mt-2 text-xl font-semibold text-neutral-950">
                            {property._count.buildings}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Units
                          </p>
                          <p className="mt-2 text-xl font-semibold text-neutral-950">
                            {property._count.units}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                            Issues
                          </p>
                          <p className="mt-2 text-xl font-semibold text-neutral-950">
                            {property._count.issues}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="text-sm text-neutral-500">
                Showing {showingFrom}-{showingTo} of {filteredTotal}
              </div>

              <div className="flex items-center gap-3">
                {safeCurrentPage > 1 ? (
                  <Link
                    href={prevHref}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-400">
                    Previous
                  </span>
                )}

                <div className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700">
                  {safeCurrentPage} / {totalPages}
                </div>

                {safeCurrentPage < totalPages ? (
                  <Link
                    href={nextHref}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl border border-neutral-200 px-4 text-sm font-medium text-neutral-400">
                    Next
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}