import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCurrentOrgId } from "@/lib/auth/org";
import { deleteMembership } from "@/features/staff/actions/delete-membership";
import {
  ROLE_META,
  normalizeStaffRole,
} from "@/features/staff/constants/role-meta";

type Props = {
  params: Promise<{ role: string; membershipId: string }>;
};

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

export default async function MemberDetailPage({ params }: Props) {
  const { role, membershipId } = await params;
  const orgId = await requireCurrentOrgId();
  const normalizedRole = normalizeStaffRole(role);

  if (!normalizedRole) notFound();

  const member = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      orgId,
      role: normalizedRole,
      user: {
        is: {
          deletedAt: null,
        },
      },
    },
    select: {
      id: true,
      role: true,
      scopeType: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          slug: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
      },
    },
  });

  if (!member) notFound();

  const caretakerAssignments =
    normalizedRole === "CARETAKER"
      ? await prisma.caretakerAssignment.findMany({
          where: {
            orgId,
            caretakerUserId: member.user.id,
          },
          orderBy: [{ active: "desc" }, { assignedAt: "desc" }],
          select: {
            id: true,
            active: true,
            assignedAt: true,
            endedAt: true,
            notes: true,
            property: {
              select: {
                id: true,
                name: true,
                units: {
                  where: {
                    deletedAt: null,
                    isActive: true,
                  },
                  select: {
                    id: true,
                    houseNo: true,
                    status: true,
                  },
                  orderBy: {
                    houseNo: "asc",
                  },
                },
              },
            },
            building: {
              select: {
                id: true,
                name: true,
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                units: {
                  where: {
                    deletedAt: null,
                    isActive: true,
                  },
                  select: {
                    id: true,
                    houseNo: true,
                    status: true,
                  },
                  orderBy: {
                    houseNo: "asc",
                  },
                },
              },
            },
          },
        })
      : [];

  const meta = ROLE_META[normalizedRole];

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-5 p-5 sm:p-6">
          <Link
            href={`/staff/${normalizedRole.toLowerCase()}`}
            className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <span className="mr-2" aria-hidden="true">
              ←
            </span>
            Back to {meta.label.toLowerCase()} directory
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                {meta.shortLabel}
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">Staff profile</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {member.user.fullName}
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {meta.description}
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
              {meta.label}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Username</p>
              <p className="mt-1 text-base font-semibold text-slate-950">
                {member.user.username ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Phone</p>
              <p className="mt-1 text-base font-semibold text-slate-950">
                {member.user.phone ?? "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Status</p>
              <p className="mt-1 text-base font-semibold text-slate-950">
                {member.user.status}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Scope</p>
              <p className="mt-1 text-base font-semibold text-slate-950">
                {member.scopeType}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm text-slate-500">Email address</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {member.user.email ?? "No email"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm text-slate-500">Added on</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {formatDate(member.createdAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm text-slate-500">Account created</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {formatDate(member.user.createdAt)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm text-slate-500">Last login</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {formatDate(member.user.lastLoginAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/staff/${normalizedRole.toLowerCase()}/${member.id}/edit`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
            >
              Edit details
            </Link>

            <form
              action={async () => {
                "use server";
                await deleteMembership(member.id);
              }}
            >
              <button className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700">
                Delete membership
              </button>
            </form>
          </div>
        </div>
      </section>

      {normalizedRole === "CARETAKER" ? (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
              Caretaker allocations
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Properties, buildings, and apartments allocated to this caretaker.
            </p>
          </div>

          {caretakerAssignments.length === 0 ? (
            <div className="p-5 sm:p-6">
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No caretaker allocations found
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  This caretaker has not been allocated to any property or building yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-5 sm:p-6">
              {caretakerAssignments.map((assignment) => {
                const apartments = assignment.building
                  ? assignment.building.units
                  : assignment.property?.units ?? [];

                const title = assignment.building
                  ? `${assignment.building.property?.name ?? "Property"} · ${assignment.building.name}`
                  : assignment.property?.name ?? "Property allocation";

                return (
                  <div
                    key={assignment.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-950">
                          {title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {assignment.building ? "Building allocation" : "Property allocation"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${
                          assignment.active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {assignment.active ? "Active" : "Ended"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                          Assigned from
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-950">
                          {formatDate(assignment.assignedAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                          Ended on
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-950">
                          {formatDate(assignment.endedAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                          Apartments
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-950">
                          {apartments.length}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                        Allocated apartments
                      </p>

                      {apartments.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {apartments.map((unit) => (
                            <span
                              key={unit.id}
                              className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              {unit.houseNo}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          No apartments found under this allocation.
                        </p>
                      )}
                    </div>

                    {assignment.notes ? (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                          Notes
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {assignment.notes}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}