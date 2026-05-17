import Link from "next/link";
import { Prisma } from "@prisma/client";
import { getPagination } from "@/lib/db/pagination";
import { requireUserSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: string;
    created?: string;
    page?: string;
    pageSize?: string;
  }>;
};

const STATUS_OPTIONS = ["ALL", "ACTIVE", "INACTIVE", "BLACKLISTED"] as const;
type TenantFilterStatus = (typeof STATUS_OPTIONS)[number];

function formatStatus(status: string) {
  if (!status) return "Unknown";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function getStatusClasses(status: string) {
  const normalized = String(status).toUpperCase();

  switch (normalized) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200";
    case "INACTIVE":
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300";
    case "BLACKLISTED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300";
  }
}

function normalizeStatus(rawStatus?: string): TenantFilterStatus {
  const value = rawStatus?.trim().toUpperCase() ?? "ALL";

  return STATUS_OPTIONS.includes(value as TenantFilterStatus)
    ? (value as TenantFilterStatus)
    : "ALL";
}

function normalizeSearch(rawSearch?: string) {
  return rawSearch?.trim().slice(0, 100) ?? "";
}

function toNumber(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: unknown }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }

  return Number(value ?? 0);
}

function formatCurrency(value: unknown, currencyCode: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function buildFilterHref({
  search,
  status,
  created,
  pageSize,
}: {
  search: string;
  status: TenantFilterStatus;
  created: boolean;
  pageSize: number;
}) {
  const params = new URLSearchParams();

  if (search.trim()) params.set("search", search.trim());
  if (status !== "ALL") params.set("status", status);
  if (created) params.set("created", "1");
  params.set("page", "1");
  params.set("pageSize", String(pageSize));

  return `/dashboard/org/tenants?${params.toString()}`;
}

function buildTenantWhere({
  orgId,
  search,
  status,
}: {
  orgId: string;
  search: string;
  status: TenantFilterStatus;
}): Prisma.TenantWhereInput {
  return {
    orgId,
    deletedAt: null,
    ...(status !== "ALL" ? { status } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { nationalId: { contains: search, mode: "insensitive" } },
            { kraPin: { contains: search, mode: "insensitive" } },
            {
              leases: {
                some: {
                  deletedAt: null,
                  unit: {
                    OR: [
                      { houseNo: { contains: search, mode: "insensitive" } },
                      {
                        building: {
                          is: {
                            name: { contains: search, mode: "insensitive" },
                          },
                        },
                      },
                      {
                        property: {
                          is: {
                            OR: [
                              { name: { contains: search, mode: "insensitive" } },
                              { location: { contains: search, mode: "insensitive" } },
                              { address: { contains: search, mode: "insensitive" } },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            {
              leases: {
                some: {
                  deletedAt: null,
                  caretaker: {
                    is: {
                      OR: [
                        { fullName: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                        { phone: { contains: search, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              },
            },
          ],
        }
      : {}),
  };
}

export default async function OrgTenantsPage({ searchParams }: PageProps) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return <Notice tone="warning">No active organisation found for your account.</Notice>;
  }

  if (
    !session.activeOrgRole ||
    !["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(session.activeOrgRole)
  ) {
    return <Notice tone="warning">You do not have permission to view organisation tenants.</Notice>;
  }

  const params = searchParams ? await searchParams : {};
  const search = normalizeSearch(params.search);
  const status = normalizeStatus(params.status);
  const created = params.created === "1";
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 20),
  });
  const orgId = session.activeOrgId;
  const where = buildTenantWhere({ orgId, search, status });

  const [
    organization,
    tenants,
    totalTenants,
    activeTenants,
    inactiveTenants,
    blacklistedTenants,
    assignedTenants,
  ] = await Promise.all([
    prisma.organization.findFirst({
      where: {
        id: orgId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        currencyCode: true,
      },
    }),
    prisma.tenant.findMany({
      where,
      orderBy: [{ fullName: "asc" }, { createdAt: "desc" }],
      skip,
      take,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        nationalId: true,
        createdAt: true,
        leases: {
          where: {
            deletedAt: null,
            status: "ACTIVE",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            status: true,
            startDate: true,
            dueDay: true,
            monthlyRent: true,
            caretaker: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
              },
            },
            unit: {
              select: {
                id: true,
                houseNo: true,
                type: true,
                bedrooms: true,
                building: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                property: {
                  select: {
                    id: true,
                    name: true,
                    location: true,
                    address: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.tenant.count({ where }),
    prisma.tenant.count({ where: { orgId, deletedAt: null, status: "ACTIVE" } }),
    prisma.tenant.count({ where: { orgId, deletedAt: null, status: "INACTIVE" } }),
    prisma.tenant.count({ where: { orgId, deletedAt: null, status: "BLACKLISTED" } }),
    prisma.tenant.count({
      where: {
        orgId,
        deletedAt: null,
        leases: {
          some: {
            deletedAt: null,
            status: "ACTIVE",
          },
        },
      },
    }),
  ]);

  const currencyCode = organization?.currencyCode ?? "KES";

  return (
    <div className="space-y-5 text-slate-950 dark:text-slate-100">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Tenant operations
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                {organization?.name ?? "Organisation"} Tenants
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Track tenants by property, apartment/block, unit, location,
                lease, and caretaker from one searchable directory.
              </p>
            </div>

            <Link
              href="/dashboard/org/tenants/new"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
            >
              Create new tenant
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="All tenants" value={activeTenants + inactiveTenants + blacklistedTenants} />
            <StatCard label="Active" value={activeTenants} />
            <StatCard label="Inactive" value={inactiveTenants} />
            <StatCard label="Blacklisted" value={blacklistedTenants} />
            <StatCard label="Assigned units" value={assignedTenants} />
          </div>
        </div>
      </section>

      {created ? (
        <Notice tone="success">
          Tenant created successfully. If a unit was selected during creation, it
          has already been mapped through an active lease.
        </Notice>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
        <form className="space-y-3">
          <div className="flex flex-col gap-2 lg:flex-row">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search tenant, phone, property, apartment, unit, location, or caretaker"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-white/30"
            />

            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="pageSize" value={pageSize} />
            {created ? <input type="hidden" name="created" value="1" /> : null}

            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Search
            </button>
          </div>

          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {STATUS_OPTIONS.map((option) => {
              const active = status === option;

              return (
                <Link
                  key={option}
                  href={buildFilterHref({ search, status: option, created, pageSize })}
                  className={[
                    "inline-flex h-10 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium transition",
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-950"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  {option === "ALL" ? "All" : formatStatus(option)}
                </Link>
              );
            })}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-white/10 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white sm:text-lg">
                Tenant directory
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Showing tenant location, apartment/block, house/unit, lease, and caretaker.
              </p>
            </div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {totalTenants.toLocaleString()} found
            </span>
          </div>
        </div>

        {tenants.length === 0 ? (
          <div className="p-5 sm:p-6">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center dark:border-white/15 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No tenants found
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Try another search or create a new tenant.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 xl:hidden">
              {tenants.map((tenant) => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  currencyCode={currencyCode}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto xl:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                  <tr>
                    <th className="px-5 py-3 font-medium">Tenant</th>
                    <th className="px-5 py-3 font-medium">Property / location</th>
                    <th className="px-5 py-3 font-medium">Apartment</th>
                    <th className="px-5 py-3 font-medium">Unit</th>
                    <th className="px-5 py-3 font-medium">Caretaker</th>
                    <th className="px-5 py-3 font-medium">Lease</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => {
                    const details = getTenantDetails(tenant, currencyCode);

                    return (
                      <tr
                        key={tenant.id}
                        className="border-t border-slate-100 align-top dark:border-white/10"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-950 dark:text-white">
                            {tenant.fullName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {tenant.phone}
                          </p>
                          <p className="mt-1 max-w-[180px] truncate text-xs text-slate-500 dark:text-slate-400">
                            {tenant.email ?? "No email"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {details.property}
                          </p>
                          <p className="mt-1 max-w-[180px] text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {details.location}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          {details.apartment}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {details.unit}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {details.unitType}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <p className="font-medium text-slate-800 dark:text-slate-100">
                            {details.caretaker}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {details.caretakerContact}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                          <p>{details.rent}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Due day {details.dueDay}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                              String(tenant.status),
                            )}`}
                          >
                            {formatStatus(String(tenant.status))}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/dashboard/org/tenants/${tenant.id}`}
                            className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <Pagination
          page={page}
          pageSize={pageSize}
          total={totalTenants}
          search={search}
          status={status}
          created={created}
        />
      </section>
    </div>
  );
}

type TenantRow = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  status: string;
  nationalId: string | null;
  createdAt: Date;
  leases: Array<{
    id: string;
    status: string;
    startDate: Date;
    dueDay: number;
    monthlyRent: unknown;
    caretaker: {
      id: string;
      fullName: string;
      phone: string | null;
      email: string | null;
    } | null;
    unit: {
      id: string;
      houseNo: string;
      type: string;
      bedrooms: number | null;
      building: {
        id: string;
        name: string;
      } | null;
      property: {
        id: string;
        name: string;
        location: string | null;
        address: string | null;
      };
    };
  }>;
};

function getTenantDetails(tenant: TenantRow, currencyCode: string) {
  const lease = tenant.leases[0] ?? null;
  const unit = lease?.unit ?? null;
  const property = unit?.property ?? null;
  const caretaker = lease?.caretaker ?? null;

  return {
    property: property?.name ?? "Not assigned",
    location: property?.location ?? property?.address ?? "No location recorded",
    apartment: unit?.building?.name ?? "No apartment/block",
    unit: unit?.houseNo ? `House ${unit.houseNo}` : "No unit",
    unitType:
      unit?.bedrooms && unit.bedrooms > 0
        ? `${unit.bedrooms} bedroom`
        : unit?.type
          ? formatStatus(unit.type.replaceAll("_", " "))
          : "No unit type",
    caretaker: caretaker?.fullName ?? "No caretaker",
    caretakerContact: caretaker?.phone ?? caretaker?.email ?? "No contact",
    rent: lease ? formatCurrency(lease.monthlyRent, currencyCode) : "No lease",
    dueDay: lease?.dueDay ?? "—",
  };
}

function TenantCard({
  tenant,
  currencyCode,
}: {
  tenant: TenantRow;
  currencyCode: string;
}) {
  const details = getTenantDetails(tenant, currencyCode);

  return (
    <Link
      href={`/dashboard/org/tenants/${tenant.id}`}
      className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
            {tenant.fullName}
          </h3>
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {tenant.phone} · {tenant.email ?? "No email"}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
            String(tenant.status),
          )}`}
        >
          {formatStatus(String(tenant.status))}
        </span>
      </div>

      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950">
        <InfoLine label="Property" value={details.property} />
        <InfoLine label="Location" value={details.location} />
        <InfoLine label="Apartment" value={details.apartment} />
        <InfoLine label="Unit" value={`${details.unit} · ${details.unitType}`} />
        <InfoLine label="Caretaker" value={details.caretaker} />
        <InfoLine label="Lease" value={`${details.rent} · Due day ${details.dueDay}`} />
      </div>
    </Link>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-slate-700 dark:text-slate-200">
        {value}
      </span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-white/10 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "success" | "warning";
  children: React.ReactNode;
}) {
  const classes =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-100"
      : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100";

  return (
    <div className={`rounded-2xl border px-4 py-4 text-sm shadow-sm ${classes}`}>
      {children}
    </div>
  );
}

function Pagination({
  page,
  pageSize,
  total,
  search,
  status,
  created,
}: {
  page: number;
  pageSize: number;
  total: number;
  search: string;
  status: TenantFilterStatus;
  created: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  function href(nextPage: number) {
    const params = new URLSearchParams();

    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    if (created) params.set("created", "1");
    params.set("page", String(nextPage));
    params.set("pageSize", String(pageSize));

    return `/dashboard/org/tenants?${params.toString()}`;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {from}-{to} of {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={href(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`rounded-xl border px-3 py-2 font-medium ${
            page <= 1
              ? "pointer-events-none border-slate-200 bg-slate-50 text-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-600"
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Previous
        </Link>
        <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
          {page} / {totalPages}
        </span>
        <Link
          href={href(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`rounded-xl border px-3 py-2 font-medium ${
            page >= totalPages
              ? "pointer-events-none border-slate-200 bg-slate-50 text-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-600"
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
