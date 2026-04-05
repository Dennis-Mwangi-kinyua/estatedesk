import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import {
  ROLE_META,
  STAFF_ROLES,
} from "@/features/staff/constants/role-meta";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        No active organisation found for your account.
      </div>
    );
  }

  const memberships = await prisma.membership.findMany({
    where: {
      orgId: session.activeOrgId,
      role: {
        in: [...STAFF_ROLES],
      },
      user: {
        deletedAt: null,
      },
    },
    select: {
      id: true,
      role: true,
    },
  });

  const counts = STAFF_ROLES.reduce<Record<string, number>>((acc, role) => {
    acc[role] = memberships.filter((member) => member.role === role).length;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-gray-500">Organisation people</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Staff & Roles</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500">
          Manage organisation members by role with full CRUD access.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {STAFF_ROLES.map((role) => {
          const meta = ROLE_META[role];

          return (
            <Link
              key={role}
              href={`/staff/${role.toLowerCase()}`}
              className={`group rounded-[28px] border border-black/10 bg-gradient-to-br ${meta.cardClass} p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-3xl">{meta.emoji}</div>
                  <h2 className="mt-3 text-lg font-semibold text-neutral-950">
                    {meta.label}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {meta.description}
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}
                >
                  {counts[role] ?? 0}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm font-medium text-neutral-700">
                <span>View members</span>
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}