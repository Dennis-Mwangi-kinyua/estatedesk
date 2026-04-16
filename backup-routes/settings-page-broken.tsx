import { cache } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LeaseStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RawSearchParams = {
  q?: string | string[];
  status?: string | string[];
};

type PageProps = {
  searchParams?: Promise<RawSearchParams> | RawSearchParams;
};

type StatusFilter = LeaseStatus | "ALL";

type SessionResolver = () => Promise<unknown> | unknown;

type SessionModule = Partial<
  Record<"getSession" | "auth" | "requireSession" | "getCurrentSession", SessionResolver>
>;

type LeaseRow = {
  id: string;
  tenant: string;
  unit: string;
  property: string;
  rent: number;
  dueDay: number;
  status: LeaseStatus;
  startDate: Date;
  endDate: Date | null;
  contractUploaded: boolean;
};

type OrgMeta = {
  name: string;
  currencyCode: string;
};

type LeaseStatusCounts = Record<LeaseStatus, number>;

const BASE_PATH = "/dashboard/org/leases";

const STATUS_TABS: Array<{ label: string; value: StatusFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Pending", value: "PENDING" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Terminated", value: "TERMINATED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_STYLES: Record<LeaseStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  EXPIRED: "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200",
  TERMINATED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  CANCELLED: "bg-red-50 text-red-700 ring-1 ring-red-200",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getSingleParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeQuery(value?: string) {
  return value?.trim() ?? "";
}

function normalizeStatus(value?: string): StatusFilter {
  const normalized = value?.toUpperCase();

  if (!normalized) return "ALL";

  return STATUS_TABS.some((tab) => tab.value === normalized)
    ? (normalized as StatusFilter)
    : "ALL";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractUserId(session: unknown) {
  if (!isRecord(session)) return null;

  const directUserId = session.userId;
  if (typeof directUserId === "string" && directUserId.length > 0) {
    return directUserId;
  }

  const user = session.user;
  if (isRecord(user) && typeof user.id === "string" && user.id.length > 0) {
    return user.id;
  }

  const nestedSession = session.session;
  if (isRecord(nestedSession)) {
    const nestedUser = nestedSession.user;
    if (
      isRecord(nestedUser) &&
      typeof nestedUser.id === "string" &&
      nestedUser.id.length > 0
    ) {
      return nestedUser.id;
    }
  }

  return null;
}

async function runSessionResolver(
  resolver?: SessionResolver
): Promise<unknown | null> {
  if (typeof resolver !== "function") return null;
  return await resolver();
}

function buildHref(status: StatusFilter, q: string) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (status !== "ALL") params.set("status", status);

  const query = params.toString();
  return query ? `${BASE_PATH}?${query}` : BASE_PATH;
}

function formatCurrency(value: number, currencyCode = "KES") {
  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `KES ${value.toLocaleString()}`;
  }
}

function formatDate(value: Date | null) {
  if (!value) return "Open-ended";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function buildLeaseWhere(args: {
  orgId: string;
  status: StatusFilter;
  q: string;
}): Prisma.LeaseWhereInput {
  const { orgId, status, q } = args;

  const where: Prisma.LeaseWhereInput = {
    orgId,
    deletedAt: null,
  };

  if (status !== "ALL") {
    where.status = status;
  }

  if (!q) {
    return where;
  }

  where.OR = [
    {
      id: {
        contains: q,
        mode: "insensitive",
      },
    },
    {
      tenant: {
        fullName: {
          contains: q,
          mode: "insensitive",
        },
      },
    },
    {
      unit: {
        houseNo: {
          contains: q,
          mode: "insensitive",
        },
      },
    },
    {
      unit: {
        property: {
          name: {
            contains: q,
            mode: "insensitive",
          },
        },
      },
    },
    {
      unit: {
        building: {
          name: {
            contains: q,
            mode: "insensitive",
          },
        },
      },
    },
  ];

  return where;
}

const getCurrentUserId = cache(async () => {
  const sessionModule = (await import("@/lib/auth/session")) as SessionModule;

  const session =
    (await runSessionResolver(sessionModule.getSession)) ??
    (await runSessionResolver(sessionModule.auth)) ??
    (await runSessionResolver(sessionModule.requireSession)) ??
    (await runSessionResolver(sessionModule.getCurrentSession));

  const userId = extractUserId(session);

  if (!userId) {
    redirect("/login");
  }

  return userId;
});

const getCurrentOrgId = cache(async (userId: string) => {
  const activeSession = await prisma.userSession.findUnique({
    where: { userId },
    select: {
      activeMembership: {
        select: {
          orgId: true,
        },
      },
    },
  });

  if (activeSession?.activeMembership?.orgId) {
    return activeSession.activeMembership.orgId;
  }

  const latestMembership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      orgId: true,
    },
  });

  if (!latestMembership?.orgId) {
    redirect("/dashboard");
  }

  return latestMembership.orgId;
});

const getOrgMeta = cache(async (orgId: string): Promise<OrgMeta> => {
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      name: true,
      currencyCode: true,
    },
  });

  return {
    name: organization?.name ?? "Organization",
    currencyCode: organization?.currencyCode ?? "KES",
  };
});

const getLeaseStatusCounts = cache(async (orgId: string) => {
  const grouped = await prisma.lease.groupBy({
    by: ["status"],
    where: {
      orgId,
      deletedAt: null,
    },
    _count: {
      _all: true,
    },
  });

  const counts: LeaseStatusCounts = {
    ACTIVE: 0,
    PENDING: 0,
    EXPIRED: 0,
    TERMINATED: 0,
    CANCELLED: 0,
  };

  let total = 0;

  for (const row of grouped) {
    counts[row.status] = row._count._all;
    total += row._count._all;
  }

  return {
    total,
    counts,
  };
});

const getLeases = cache(
  async (orgId: string, status: StatusFilter, q: string): Promise<LeaseRow[]> => {
    const leases = await prisma.lease.findMany({
      where: buildLeaseWhere({ orgId, status, q }),
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        dueDay: true,
        monthlyRent: true,
        startDate: true,
        endDate: true,
        status: true,
        contractDocumentId: true,
        tenant: {
          select: {
            fullName: true,
          },
        },
        unit: {
          select: {
            houseNo: true,
            property: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return leases.map((lease) => ({
      id: lease.id,
      tenant: lease.tenant.fullName,
      unit: lease.unit.houseNo,
      property: lease.unit.property.name,
      rent: Number(lease.monthlyRent),
      dueDay: lease.dueDay,
      status: lease.status,
      startDate: lease.startDate,
      endDate: lease.endDate,
      contractUploaded: Boolean(lease.contractDocumentId),
    }));
  }
);

function StatusBadge({ status }: { status: LeaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        STATUS_STYLES[status]
      )}
    >
      {status}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-black/5 bg-white/95 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
        {value}
      </p>
    </div>
  );
}

function MobileLeaseCard({
  lease,
  currencyCode,
}: {
  lease: LeaseRow;
  currencyCode: string;
}) {
  return (
    <article className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-semibold text-neutral-950">
            {lease.tenant}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">{lease.id}</p>
        </div>
        <StatusBadge status={lease.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] bg-neutral-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Unit
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {lease.unit}
          </p>
        </div>

        <div className="rounded-[20px] bg-neutral-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Due day
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {lease.dueDay}
          </p>
        </div>

        <div className="col-span-2 rounded-[20px] bg-neutral-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Property
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {lease.property}
          </p>
        </div>

        <div className="col-span-2 rounded-[20px] bg-neutral-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Monthly rent
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {formatCurrency(lease.rent, currencyCode)}
          </p>
        </div>

        <div className="col-span-2 rounded-[20px] bg-neutral-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
            Lease dates
          </p>
          <p className="mt-1 text-sm font-medium text-neutral-900">
            {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
        <span className="text-sm text-neutral-500">
          {lease.contractUploaded ? "Contract uploaded" : "No contract"}
        </span>
        <span className="text-sm font-medium text-neutral-900">Lease</span>
      </div>
    </article>
  );
}

function SearchBar({
  q,
  status,
}: {
  q: string;
  status: StatusFilter;
}) {
  return (
    <form method="get" className="mt-4">
      {status !== "ALL" ? (
        <input type="hidden" name="status" value={status} />
      ) : null}

      <div className="flex items-center gap-2 rounded-[22px] border border-black/5 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search tenant, unit, property, or lease ID"
          className="h-10 w-full bg-transparent px-1 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-full bg-neutral-950 px-4 text-sm font-medium text-white"
        >
          Search
        </button>
      </div>
    </form>
  );
}

function StatusTabs({ q, status }: { q: string; status: StatusFilter }) {
  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {STATUS_TABS.map((tab) => {
        const active = tab.value === status;

        return (
          <Link
            key={tab.value}
            href={buildHref(tab.value, q)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-neutral-950 text-white"
                : "bg-white text-neutral-700 ring-1 ring-black/5 hover:bg-neutral-50"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

function DesktopTable({
  rows,
  currencyCode,
}: {
  rows: LeaseRow[];
  currencyCode: string;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-neutral-50 text-xs uppercase tracking-[0.16em] text-neutral-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Tenant</th>
              <th className="px-6 py-4 font-semibold">Unit</th>
              <th className="px-6 py-4 font-semibold">Property</th>
              <th className="px-6 py-4 font-semibold">Monthly rent</th>
              <th className="px-6 py-4 font-semibold">Due day</th>
              <th className="px-6 py-4 font-semibold">Dates</th>
              <th className="px-6 py-4 font-semibold">Contract</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-sm text-neutral-500"
                >
                  No leases found.
                </td>
              </tr>
            ) : (
              rows.map((lease) => (
                <tr key={lease.id} className="border-t border-black/5 align-top">
                  <td className="px-6 py-4">
                    <div className="font-medium text-neutral-900">
                      {lease.tenant}
                    </div>
                    <div className="mt-1 text-sm text-neutral-500">
                      {lease.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {lease.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {lease.property}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {formatCurrency(lease.rent, currencyCode)}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {lease.dueDay}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-700">
                    {lease.contractUploaded ? "Uploaded" : "Missing"}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={lease.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function OrgLeasesPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const q = normalizeQuery(getSingleParam(params.q));
  const status = normalizeStatus(getSingleParam(params.status));

  const userId = await getCurrentUserId();
  const orgId = await getCurrentOrgId(userId);

  const [{ name, currencyCode }, { total, counts }, rows] = await Promise.all([
    getOrgMeta(orgId),
    getLeaseStatusCounts(orgId),
    getLeases(orgId, status, q),
  ]);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl lg:max-w-none">
          <header className="sticky top-0 z-20 -mx-4 border-b border-black/5 bg-[#f5f5f7]/85 px-4 pb-4 pt-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-6 lg:pt-0 lg:backdrop-blur-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-500">{name}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                  Leases
                </h1>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Mobile-first lease management with tenant, property, rent, and
                  contract status in one place.
                </p>
              </div>

              <button
                type="button"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
              >
                New lease
              </button>
            </div>

            <SearchBar q={q} status={status} />
            <StatusTabs q={q} status={status} />

            <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Active" value={counts.ACTIVE} />
              <StatCard label="Pending" value={counts.PENDING} />
              <StatCard label="Expired" value={counts.EXPIRED} />
              <StatCard label="Terminated" value={counts.TERMINATED} />
            </section>

            <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
              <span>
                Showing {rows.length} of {total} leases
              </span>

              {(q || status !== "ALL") && (
                <Link href={BASE_PATH} className="font-medium text-neutral-900">
                  Clear filters
                </Link>
              )}
            </div>
          </header>

          <section className="mt-5 lg:hidden">
            {rows.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-black/10 bg-white p-10 text-center text-sm text-neutral-500 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                No leases found.
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((lease) => (
                  <MobileLeaseCard
                    key={lease.id}
                    lease={lease}
                    currencyCode={currencyCode}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mt-6 hidden lg:block">
            <DesktopTable rows={rows} currencyCode={currencyCode} />
          </section>
        </div>
      </div>
    </div>
  );
}