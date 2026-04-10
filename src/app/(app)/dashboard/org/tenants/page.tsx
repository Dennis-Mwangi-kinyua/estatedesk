import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    search?: string;
    status?: string;
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
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INACTIVE":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    case "BLACKLISTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function buildFilterHref(search: string, status: TenantFilterStatus) {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set("search", search.trim());
  }

  if (status !== "ALL") {
    params.set("status", status);
  }

  const query = params.toString();
  return query ? `?${query}` : "?";
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

function getTenantUnitLabel(tenant: {
  leases: Array<{
    unit: {
      houseNo: string;
      building: { name: string | null } | null;
      property: { name: string | null } | null;
    } | null;
  }>;
}) {
  const unit = tenant.leases[0]?.unit;

  if (!unit) return "Not assigned";

  return [
    unit.property?.name,
    unit.building?.name,
    unit.houseNo ? `Unit ${unit.houseNo}` : null,
  ]
    .filter(Boolean)
    .join(" / ");
}

export default async function OrgTenantsPage({ searchParams }: PageProps) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No active organisation found for your account.
      </div>
    );
  }

  if (
    !session.activeOrgRole ||
    !["ADMIN", "MANAGER", "OFFICE", "ACCOUNTANT"].includes(
      session.activeOrgRole,
    )
  ) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        You do not have permission to view organisation tenants.
      </div>
    );
  }

  const params = searchParams ? await searchParams : {};
  const search = normalizeSearch(params.search);
  const status = normalizeStatus(params.status);

  const orgId = String(session.activeOrgId ?? "").trim();

  if (!orgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Invalid organisation ID for your account.
      </div>
    );
  }

  let organization: { id: string; name: string } | null = null;
  let tenants: Array<{
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    status: string;
    leases: Array<{
      unit: {
        houseNo: string;
        building: { name: string | null } | null;
        property: { name: string | null } | null;
      } | null;
    }>;
  }> = [];

  try {
    organization = await prisma.organization.findFirst({
      where: {
        id: orgId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    tenants = await prisma.tenant.findMany({
      where: {
        orgId,
        deletedAt: null,
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(status !== "ALL" ? { status } : {}),
      },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
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
            unit: {
              select: {
                houseNo: true,
                building: {
                  select: { name: true },
                },
                property: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to load organisation tenants:", error);

    return (
      <div className="min-h-screen bg-[#f5f5f7] px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm text-red-800 shadow-sm">
            Failed to load organisation tenants.
            <div className="mt-2 text-red-700/80">
              Check your server logs, then run:
              <div className="mt-2 rounded-xl bg-white/70 p-3 font-mono text-xs">
                npx prisma generate
                <br />
                npx prisma migrate status
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="rounded-[28px] border border-black/5 bg-white/90 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
              {organization?.name ?? "Organisation"} Tenants
            </h2>
            <p className="text-sm text-neutral-600">
              Search, filter, and manage tenant records.
            </p>
          </div>
        </div>

        <div className="sticky top-2 z-10 rounded-[28px] border border-black/5 bg-white/90 p-3 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur">
          <form className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by name, email, or phone"
                className="h-12 w-full rounded-2xl border border-black/10 bg-[#f7f7f8] px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white"
              />

              <input type="hidden" name="status" value={status} />

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-neutral-950 px-5 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.99]"
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
                    href={buildFilterHref(search, option)}
                    className={[
                      "inline-flex h-10 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium transition",
                      active
                        ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                        : "border-black/10 bg-[#f7f7f8] text-neutral-700 hover:bg-white",
                    ].join(" ")}
                  >
                    {option === "ALL" ? "All" : formatStatus(option)}
                  </Link>
                );
              })}
            </div>
          </form>
        </div>

        <div className="px-1 text-sm text-neutral-500">
          {tenants.length} {tenants.length === 1 ? "tenant" : "tenants"} found
        </div>

        {tenants.length === 0 ? (
          <div className="rounded-[28px] border border-black/5 bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-sm text-neutral-600">No tenants found.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 lg:hidden">
              {tenants.map((tenant) => {
                const unitLabel = getTenantUnitLabel(tenant);

                return (
                  <div
                    key={tenant.id}
                    className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold text-neutral-950">
                          {tenant.fullName}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
                          {unitLabel}
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

                    <div className="mt-4 space-y-3 rounded-2xl bg-[#f7f7f8] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                          Phone
                        </span>
                        <span className="text-right text-sm text-neutral-700">
                          {tenant.phone}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                          Email
                        </span>
                        <span className="break-all text-right text-sm text-neutral-700">
                          {tenant.email ?? "—"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Link
                        href={`/dashboard/org/tenants/${tenant.id}`}
                        className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-neutral-950 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.99]"
                      >
                        View tenant
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)] lg:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-black/5 bg-[#fafafa]">
                    <tr className="text-left text-neutral-500">
                      <th className="px-5 py-4 font-medium">Tenant</th>
                      <th className="px-5 py-4 font-medium">Phone</th>
                      <th className="px-5 py-4 font-medium">Email</th>
                      <th className="px-5 py-4 font-medium">Unit</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tenants.map((tenant) => {
                      const unitLabel = getTenantUnitLabel(tenant);

                      return (
                        <tr
                          key={tenant.id}
                          className="border-t border-black/5 transition hover:bg-neutral-50/80"
                        >
                          <td className="px-5 py-4 font-medium text-neutral-950">
                            {tenant.fullName}
                          </td>
                          <td className="px-5 py-4 text-neutral-700">
                            {tenant.phone}
                          </td>
                          <td className="px-5 py-4 text-neutral-700">
                            {tenant.email ?? "—"}
                          </td>
                          <td className="px-5 py-4 text-neutral-700">
                            {unitLabel}
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
                              className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}