import Link from "next/link";
import { notFound } from "next/navigation";
import { LeaseStatus, OrgRole, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { unlinkCaretakerAssignmentAction } from "@/features/staff/actions/unlink-caretaker-assignment";
import { removeCaretakerMembershipAction } from "@/features/staff/actions/remove-caretaker-membership";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    membershipId: string;
  }>;
};

function formatDate(value?: Date | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

function formatDateTime(value?: Date | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function statusBadgeClass(status: UserStatus) {
  switch (status) {
    case UserStatus.ACTIVE:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case UserStatus.SUSPENDED:
      return "border-amber-200 bg-amber-50 text-amber-700";
    case UserStatus.DISABLED:
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function leaseBadgeClass(status: LeaseStatus) {
  switch (status) {
    case LeaseStatus.ACTIVE:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case LeaseStatus.PENDING:
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function CaretakerProfilePage({ params }: PageProps) {
  const session = await requireUserSession();
  const { membershipId } = await params;

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm">
        No active organisation found for your account.
      </div>
    );
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id: membershipId,
      orgId: session.activeOrgId,
      role: OrgRole.CARETAKER,
      user: {
        deletedAt: null,
      },
    },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      role: true,
      scopeType: true,
      scopeId: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          emailVerified: true,
          phoneVerified: true,
        },
      },
      org: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!membership) {
    notFound();
  }

  const assignments = await prisma.caretakerAssignment.findMany({
    where: {
      orgId: session.activeOrgId,
      caretakerUserId: membership.user.id,
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
        },
      },
      building: {
        select: {
          id: true,
          name: true,
        },
      },
      unit: {
        select: {
          id: true,
          houseNo: true,
        },
      },
    },
    orderBy: [{ active: "desc" }, { assignedAt: "desc" }],
  });

  const recentLeases = await prisma.lease.findMany({
    where: {
      orgId: session.activeOrgId,
      caretakerUserId: membership.user.id,
      deletedAt: null,
    },
    include: {
      tenant: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
      unit: {
        select: {
          id: true,
          houseNo: true,
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 6,
  });

  const activeLeaseCount = await prisma.lease.count({
    where: {
      orgId: session.activeOrgId,
      caretakerUserId: membership.user.id,
      deletedAt: null,
      status: LeaseStatus.ACTIVE,
    },
  });

  const totalLeaseCount = await prisma.lease.count({
    where: {
      orgId: session.activeOrgId,
      caretakerUserId: membership.user.id,
      deletedAt: null,
    },
  });

  const assignedIssueCount = await prisma.issueTicket.count({
    where: {
      orgId: session.activeOrgId,
      assignedToUserId: membership.user.id,
    },
  });

  const activeAssignments = assignments.filter((item) => item.active);

  const propertyCount = new Set(
    activeAssignments
      .map((item) => item.property?.id)
      .filter((value): value is string => Boolean(value))
  ).size;

  const buildingCount = new Set(
    activeAssignments
      .map((item) => item.building?.id)
      .filter((value): value is string => Boolean(value))
  ).size;

  const unitCount = new Set(
    activeAssignments
      .map((item) => item.unit?.id)
      .filter((value): value is string => Boolean(value))
  ).size;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                {getInitials(membership.user.fullName)}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  Organisation staff
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {membership.user.fullName}
                </h1>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Caretaker profile, assignments, and managed lease activity.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                    CARETAKER
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusBadgeClass(
                      membership.user.status
                    )}`}
                  >
                    {membership.user.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href="/staff/caretaker"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
              >
                Back to Caretakers
              </Link>

              <Link
                href={`/staff/caretaker/${membership.id}/edit`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Edit Caretaker
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Active assignments</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {activeAssignments.length.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Active leases</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {activeLeaseCount.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Managed units</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {unitCount.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Assigned issues</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {assignedIssueCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-1">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
                Profile details
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Core staff and account information.
              </p>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  Full name
                </p>
                <p className="mt-1 text-sm font-medium text-slate-950">
                  {membership.user.fullName}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  Email
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {membership.user.email || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  Phone
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {membership.user.phone || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  Organisation
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {membership.org.name}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  Membership ID
                </p>
                <p className="mt-1 break-all text-sm text-slate-700">
                  {membership.id}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  Joined staff
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {formatDate(membership.createdAt)}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
                  Last login
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {formatDateTime(membership.user.lastLoginAt)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">Email verified</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {membership.user.emailVerified ? "Yes" : "No"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">Phone verified</p>
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {membership.user.phoneVerified ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="rounded-3xl border border-rose-200 bg-rose-50 shadow-sm">
            <div className="border-b border-rose-100 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-rose-950 sm:text-lg">
                Danger zone
              </h2>
              <p className="mt-1 text-sm text-rose-700">
                Remove this caretaker from the organisation staff system.
              </p>
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              <form action={removeCaretakerMembershipAction} className="space-y-3">
                <input type="hidden" name="membershipId" value={membership.id} />

                <textarea
                  name="reason"
                  rows={3}
                  placeholder="Optional reason for removing this caretaker"
                  className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />

                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-700"
                >
                  Remove caretaker from system
                </button>
              </form>
            </div>
          </section>
        </div>

        <div className="space-y-5 xl:col-span-2">
          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
                Assignment coverage
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Active and historical caretaker assignment records.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-5 sm:grid-cols-3 sm:p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-500">Properties</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {propertyCount.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-500">Buildings</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {buildingCount.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-500">Units</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {unitCount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {assignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  No caretaker assignments found for this staff member yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-950 sm:text-base">
                              {assignment.unit?.houseNo
                                ? `Unit ${assignment.unit.houseNo}`
                                : assignment.building?.name
                                  ? assignment.building.name
                                  : assignment.property?.name || "Assignment"}
                            </h3>

                            {assignment.isPrimary ? (
                              <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                                Primary
                              </span>
                            ) : null}

                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                                assignment.active
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}
                            >
                              {assignment.active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1 text-sm text-slate-600">
                            <p>
                              <span className="font-medium text-slate-700">
                                Property:
                              </span>{" "}
                              {assignment.property?.name || "—"}
                            </p>
                            <p>
                              <span className="font-medium text-slate-700">
                                Building:
                              </span>{" "}
                              {assignment.building?.name || "—"}
                            </p>
                            <p>
                              <span className="font-medium text-slate-700">
                                Unit:
                              </span>{" "}
                              {assignment.unit?.houseNo || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-sm text-slate-600">
                          <p>
                            Assigned:{" "}
                            <span className="font-medium text-slate-800">
                              {formatDate(assignment.assignedAt)}
                            </span>
                          </p>
                          <p className="mt-1">
                            Ended:{" "}
                            <span className="font-medium text-slate-800">
                              {formatDate(assignment.endedAt)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {assignment.notes ? (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                          {assignment.notes}
                        </div>
                      ) : null}

                      {assignment.active ? (
                        <form
                          action={unlinkCaretakerAssignmentAction}
                          className="mt-4 space-y-3"
                        >
                          <input
                            type="hidden"
                            name="assignmentId"
                            value={assignment.id}
                          />
                          <input
                            type="hidden"
                            name="membershipId"
                            value={membership.id}
                          />

                          <textarea
                            name="reason"
                            rows={2}
                            placeholder={
                              assignment.unitId
                                ? "Optional reason for unlinking this caretaker from this apartment"
                                : "Optional reason for ending this caretaker assignment"
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                          />

                          <button
                            type="submit"
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                          >
                            {assignment.unitId
                              ? "Unlink caretaker from apartment"
                              : "Deactivate caretaker assignment"}
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
                Recent managed leases
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Lease records currently or previously linked to this caretaker.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 border-b border-slate-100 p-5 sm:grid-cols-2 sm:p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-500">Total linked leases</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {totalLeaseCount.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-500">Active linked leases</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {activeLeaseCount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {recentLeases.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  No lease records are currently linked to this caretaker.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentLeases.map((lease) => (
                    <div
                      key={lease.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-slate-950 sm:text-base">
                              {lease.tenant.fullName}
                            </h3>
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${leaseBadgeClass(
                                lease.status
                              )}`}
                            >
                              {lease.status}
                            </span>
                          </div>

                          <div className="mt-2 space-y-1 text-sm text-slate-600">
                            <p>
                              <span className="font-medium text-slate-700">
                                Property:
                              </span>{" "}
                              {lease.unit.property.name}
                            </p>
                            <p>
                              <span className="font-medium text-slate-700">
                                Unit:
                              </span>{" "}
                              {lease.unit.houseNo}
                            </p>
                            <p>
                              <span className="font-medium text-slate-700">
                                Tenant phone:
                              </span>{" "}
                              {lease.tenant.phone || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-sm text-slate-600">
                          <p>
                            Start:{" "}
                            <span className="font-medium text-slate-800">
                              {formatDate(lease.startDate)}
                            </span>
                          </p>
                          <p className="mt-1">
                            End:{" "}
                            <span className="font-medium text-slate-800">
                              {formatDate(lease.endDate)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {lease.notes ? (
                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                          {lease.notes}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}