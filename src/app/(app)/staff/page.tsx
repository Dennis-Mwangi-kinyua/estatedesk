import Link from "next/link";

import { getOnlineSince } from "@/lib/auth/presence";
import { requireUserSession } from "@/lib/auth/session";
import { getPagination } from "@/lib/db/pagination";
import { prisma } from "@/lib/prisma";
import {
  ROLE_META,
  STAFF_ROLES,
  type StaffRole,
} from "@/features/staff/constants/role-meta";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  page?: string;
  pageSize?: string;
}>;

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "Never";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatRelative(value: Date | null | undefined, now: Date) {
  if (!value) return "Never seen";

  const diffMs = Math.max(now.getTime() - value.getTime(), 0);
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return formatDateTime(value);
}

function RolePill({ role }: { role: StaffRole }) {
  const meta = ROLE_META[role];

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 ${meta.badgeClass}`}
    >
      {meta.label}
    </span>
  );
}

function PresencePill({ online }: { online: boolean }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        online
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200"
          : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          online ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-500"
        }`}
      />
      {online ? "Online" : "Offline"}
    </span>
  );
}

export default async function StaffPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
        No active organisation found for your account.
      </div>
    );
  }

  const params = await searchParams;
  const { page, pageSize, skip, take } = getPagination({
    page: Number(params.page ?? 1),
    pageSize: Number(params.pageSize ?? 20),
  });
  const now = new Date();
  const onlineSince = getOnlineSince(now);

  const membershipWhere = {
    orgId: session.activeOrgId,
    role: {
      in: [...STAFF_ROLES],
    },
    employmentEndedAt: null,
    org: {
      deletedAt: null,
    },
    user: {
      deletedAt: null,
    },
  };

  const [staff, totalStaff, groupedRoles, onlineStaffUsers] =
    await prisma.$transaction([
      prisma.membership.findMany({
        where: membershipWhere,
        orderBy: [{ role: "asc" }, { user: { fullName: "asc" } }],
        skip,
        take,
        select: {
          id: true,
          role: true,
          scopeType: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              status: true,
              lastLoginAt: true,
              activeSession: {
                select: {
                  lastSeenAt: true,
                  expiresAt: true,
                },
              },
            },
          },
        },
      }),
      prisma.membership.count({ where: membershipWhere }),
      prisma.membership.groupBy({
        by: ["role"],
        where: membershipWhere,
        orderBy: {
          role: "asc",
        },
        _count: {
          _all: true,
        },
      }),
      prisma.userSession.count({
        where: {
          expiresAt: {
            gt: now,
          },
          lastSeenAt: {
            gte: onlineSince,
          },
          user: {
            status: "ACTIVE",
            deletedAt: null,
            memberships: {
              some: membershipWhere,
            },
          },
        },
      }),
    ]);

  const roleCounts = STAFF_ROLES.reduce<Record<StaffRole, number>>((acc, role) => {
    acc[role] = 0;
    return acc;
  }, {} as Record<StaffRole, number>);

  for (const row of groupedRoles) {
    const role = row.role as StaffRole;
    roleCounts[role] =
      typeof row._count === "object" && row._count !== null
        ? row._count._all ?? 0
        : 0;
  }

  const rows = staff.map((membership) => {
    const role = membership.role as StaffRole;
    const lastSeenAt =
      membership.user.activeSession?.lastSeenAt ?? membership.user.lastLoginAt;
    const isOnline = Boolean(
      membership.user.activeSession &&
        membership.user.activeSession.expiresAt > now &&
        membership.user.activeSession.lastSeenAt >= onlineSince,
    );

    return {
      ...membership,
      role,
      isOnline,
      lastSeenAt,
    };
  });

  return (
    <div className="space-y-5 text-slate-950 dark:text-slate-100">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Organisation people
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                Staff Directory
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                View every staff member, their role, online status, and most
                recent activity from one place.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/staff/previous"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Previous employees
              </Link>
              <Link
                href="/staff/new"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
              >
                Add new staff
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Total staff" value={totalStaff} />
            <StatCard label="Online now" value={onlineStaffUsers} />
            <StatCard label="Offline" value={Math.max(totalStaff - onlineStaffUsers, 0)} />
          </div>

          <div className="flex flex-wrap gap-2">
            {STAFF_ROLES.map((role) => (
              <span
                key={role}
                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              >
                {ROLE_META[role].label}: {roleCounts[role]}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-white/10 sm:px-6">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white sm:text-lg">
            All staff
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Open a staff member to manage details or caretaker assignments.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="p-5 sm:p-6">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center dark:border-white/15 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                No staff members found
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Add your first staff member and choose their role during setup.
              </p>
              <Link
                href="/staff/new"
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
              >
                Add new staff
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 lg:hidden">
              {rows.map((member) => (
                <StaffCard
                  key={member.id}
                  href={`/staff/${member.role.toLowerCase()}/${member.id}`}
                  name={member.user.fullName}
                  email={member.user.email}
                  phone={member.user.phone}
                  role={member.role}
                  online={member.isOnline}
                  lastSeen={formatRelative(member.lastSeenAt, now)}
                  status={member.user.status}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                  <tr>
                    <th className="px-5 py-3 font-medium">Staff member</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Presence</th>
                    <th className="px-5 py-3 font-medium">Last seen</th>
                    <th className="px-5 py-3 font-medium">Account</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((member) => (
                    <tr
                      key={member.id}
                      className="border-t border-slate-100 dark:border-white/10"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {member.user.fullName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {member.user.email ?? member.user.phone ?? "No contact"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <RolePill role={member.role} />
                      </td>
                      <td className="px-5 py-4">
                        <PresencePill online={member.isOnline} />
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        <p className="font-medium">
                          {formatRelative(member.lastSeenAt, now)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          {formatDateTime(member.lastSeenAt)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        {member.user.status}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/staff/${member.role.toLowerCase()}/${member.id}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <StaffPagination
          page={page}
          pageSize={pageSize}
          total={totalStaff}
          basePath="/staff"
        />
      </section>
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

function StaffPagination({
  page,
  pageSize,
  total,
  basePath,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  function href(nextPage: number) {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    params.set("pageSize", String(pageSize));
    return `${basePath}?${params.toString()}`;
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

function StaffCard({
  href,
  name,
  email,
  phone,
  role,
  online,
  lastSeen,
  status,
}: {
  href: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: StaffRole;
  online: boolean;
  lastSeen: string;
  status: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm dark:border-white/10 dark:bg-slate-900 dark:hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
            {name}
          </p>
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {email ?? phone ?? "No contact"}
          </p>
        </div>
        <PresencePill online={online} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <RolePill role={role} />
        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300">
          {status}
        </span>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3 dark:border-white/10">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          Last seen
        </p>
        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
          {lastSeen}
        </p>
      </div>
    </Link>
  );
}
