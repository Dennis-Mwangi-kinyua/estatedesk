import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import {
  ROLE_META,
  STAFF_ROLES,
} from "@/features/staff/constants/role-meta";

export const dynamic = "force-dynamic";

type StaffRole = (typeof STAFF_ROLES)[number];

function getInitials(label: string) {
  return label
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function StaffPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm">
        No active organisation found for your account.
      </div>
    );
  }

  const membershipWhere = {
    orgId: session.activeOrgId,
    role: {
      in: [...STAFF_ROLES],
    },
    user: {
      is: {
        deletedAt: null,
      },
    },
  };

  const [groupedRoles, totalStaff] = await prisma.$transaction([
    prisma.membership.groupBy({
      by: ["role"],
      where: membershipWhere,
      _count: {
        _all: true,
      },
    }),
    prisma.membership.count({
      where: membershipWhere,
    }),
  ]);

  const counts = STAFF_ROLES.reduce<Record<StaffRole, number>>((acc, role) => {
    acc[role] = 0;
    return acc;
  }, {} as Record<StaffRole, number>);

  for (const row of groupedRoles) {
    counts[row.role as StaffRole] = row._count._all;
  }

  const activeRoles = STAFF_ROLES.filter(
    (role) => (counts[role] ?? 0) > 0
  ).length;
  const emptyRoles = STAFF_ROLES.length - activeRoles;

  const directoryRows = [
    {
      key: "staff",
      label: "Staff Directory",
      code: "ST",
      description:
        "View and manage all staff members across organisation roles.",
      count: totalStaff,
      href: "/staff",
      statusLabel: totalStaff > 0 ? "Active" : "No members",
    },
    {
      key: "caretaker",
      label: "Caretaker Directory",
      code: getInitials(ROLE_META.CARETAKER.label),
      description:
        "Manage caretakers assigned to operational and on-site responsibilities.",
      count: counts.CARETAKER ?? 0,
      href: "/staff/caretaker",
      statusLabel: (counts.CARETAKER ?? 0) > 0 ? "Active" : "No members",
    },
    {
      key: "admin",
      label: "Admin Directory",
      code: getInitials(ROLE_META.ADMIN.label),
      description:
        "Manage administrators with organisation-wide oversight and access.",
      count: counts.ADMIN ?? 0,
      href: "/staff/admin",
      statusLabel: (counts.ADMIN ?? 0) > 0 ? "Active" : "No members",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">
              Organisation people
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Staff Directory
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Manage staff directories, operational assignments, and organisation
              access from a single place.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Total staff</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {totalStaff.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Active role groups</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {activeRoles.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Inactive role groups</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {emptyRoles.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/staff/caretaker"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            >
              Map a Caretaker
            </Link>

            <Link
              href="/staff"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            >
              Map a Staff
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
            Directory overview
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Open the staff directory you want to manage.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 sm:p-6 lg:grid-cols-2">
          {directoryRows.map((item) => {
            const isActive = item.count > 0;

            return (
              <Link
                key={item.key}
                href={item.href}
                className="group rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                aria-label={`Open ${item.label}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                    {item.code}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-950 sm:text-base">
                          {item.label}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                            isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {item.statusLabel}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                          Records
                        </p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">
                          {item.count.toLocaleString()}
                        </p>
                      </div>

                      <span className="inline-flex items-center text-sm font-medium text-slate-700 transition group-hover:text-slate-950">
                        Open directory
                        <span className="ml-2 transition group-hover:translate-x-1">
                          →
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm text-slate-500">Available roles</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {STAFF_ROLES.length.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm text-slate-500">Unassigned roles</p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {emptyRoles.toLocaleString()}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}