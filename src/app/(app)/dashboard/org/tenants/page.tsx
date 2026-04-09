import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    search?: string;
  }>;
};

function formatStatus(status: string) {
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

export default async function OrgTenantsPage({ searchParams }: PageProps) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        You do not have permission to view organisation tenants.
      </div>
    );
  }

  const orgId = session.activeOrgId;
  const params = searchParams ? await searchParams : {};
  const search = params.search?.trim() ?? "";

  const [organization, tenants] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true },
    }),
    prisma.tenant.findMany({
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
    }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
          {organization?.name ?? "Organisation"} Tenants
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Search and manage tenant records.
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <form className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by name, email, or phone"
            className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-300"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Search
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
        {tenants.length === 0 ? (
          <div className="p-6 text-sm text-neutral-600">No tenants found.</div>
        ) : (
          <>
            <div className="grid gap-3 p-3 md:hidden">
              {tenants.map((tenant) => {
                const unit = tenant.leases[0]?.unit;

                return (
                  <div
                    key={tenant.id}
                    className="rounded-xl border border-black/10 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-950">
                          {tenant.fullName}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {unit
                            ? [
                                unit.property?.name,
                                unit.building?.name,
                                `Unit ${unit.houseNo}`,
                              ]
                                .filter(Boolean)
                                .join(" / ")
                            : "Not assigned"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${getStatusClasses(
                          String(tenant.status),
                        )}`}
                      >
                        {formatStatus(String(tenant.status))}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-neutral-600">
                      <p>{tenant.phone ?? "—"}</p>
                      <p>{tenant.email ?? "—"}</p>
                    </div>

                    <div className="mt-3">
                      <Link
                        href={`/tenants/${tenant.id}`}
                        className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-black/10 bg-white text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
                      >
                        View tenant
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="border-b border-black/10 bg-neutral-50">
                  <tr className="text-left text-neutral-500">
                    <th className="px-4 py-3 font-medium">Tenant</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {tenants.map((tenant) => {
                    const unit = tenant.leases[0]?.unit;

                    return (
                      <tr key={tenant.id} className="border-t border-black/5">
                        <td className="px-4 py-3 font-medium text-neutral-950">
                          {tenant.fullName}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {tenant.phone ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {tenant.email ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-neutral-700">
                          {unit
                            ? [
                                unit.property?.name,
                                unit.building?.name,
                                `Unit ${unit.houseNo}`,
                              ]
                                .filter(Boolean)
                                .join(" / ")
                            : "Not assigned"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                              String(tenant.status),
                            )}`}
                          >
                            {formatStatus(String(tenant.status))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/tenants/${tenant.id}`}
                            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
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
      </div>
    </div>
  );
}