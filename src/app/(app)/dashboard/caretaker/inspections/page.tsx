import Link from "next/link";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function badgeClass(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export default async function CaretakerInspectionsPage() {
  const session = await requireUserSession();

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm">
        No active organisation found for your account.
      </div>
    );
  }

  if (session.activeOrgRole !== "CARETAKER") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900 shadow-sm">
        This page is only available to caretakers.
      </div>
    );
  }

  const allocations = await prisma.caretakerAssignment.findMany({
    where: {
      orgId: session.activeOrgId,
      caretakerUserId: session.userId,
      active: true,
    },
    select: {
      propertyId: true,
      buildingId: true,
      unitId: true,
    },
  });

  const propertyIds = allocations
    .map((item) => item.propertyId)
    .filter((value): value is string => Boolean(value));

  const buildingIds = allocations
    .map((item) => item.buildingId)
    .filter((value): value is string => Boolean(value));

  const unitIds = allocations
    .map((item) => item.unitId)
    .filter((value): value is string => Boolean(value));

  const allocationFilters: Prisma.InspectionWhereInput[] = [
    {
      notice: {
        lease: {
          caretakerUserId: session.userId,
        },
      },
    },
  ];

  if (unitIds.length > 0) {
    allocationFilters.push({
      notice: {
        lease: {
          unitId: {
            in: unitIds,
          },
        },
      },
    });
  }

  if (buildingIds.length > 0) {
    allocationFilters.push({
      notice: {
        lease: {
          unit: {
            buildingId: {
              in: buildingIds,
            },
          },
        },
      },
    });
  }

  if (propertyIds.length > 0) {
    allocationFilters.push({
      notice: {
        lease: {
          unit: {
            propertyId: {
              in: propertyIds,
            },
          },
        },
      },
    });
  }

  const inspections = await prisma.inspection.findMany({
    where: {
      AND: [
        {
          notice: {
            lease: {
              orgId: session.activeOrgId,
              deletedAt: null,
            },
          },
        },
        {
          OR: allocationFilters,
        },
      ],
    },
    orderBy: {
      scheduledAt: "desc",
    },
    include: {
      notice: {
        select: {
          id: true,
          moveOutDate: true,
          tenant: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
          lease: {
            select: {
              id: true,
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
                  building: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      inspector: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  const total = inspections.length;
  const scheduled = inspections.filter((item) => item.status === "SCHEDULED").length;
  const completed = inspections.filter((item) => item.status === "COMPLETED").length;
  const cancelled = inspections.filter((item) => item.status === "CANCELLED").length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-4 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">
              Caretaker dashboard
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              My Inspections
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              View only inspections for apartments, buildings, and properties
              allocated to you.
            </p>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            This page is allocation-based. You cannot access admin property
            modules from here.
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Total inspections</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {total.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Scheduled</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {scheduled.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Completed</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {completed.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm text-slate-500">Cancelled</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {cancelled.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
            Allocated inspection tasks
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Open an inspection task, perform the inspection, and submit a report.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {inspections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No inspections found for your current allocations.
            </div>
          ) : (
            <div className="space-y-4">
              {inspections.map((inspection) => (
                <div
                  key={inspection.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-950 sm:text-base">
                          {inspection.notice.tenant.fullName}
                        </h3>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass(
                            inspection.status
                          )}`}
                        >
                          {inspection.status}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-sm text-slate-600">
                        <p>
                          <span className="font-medium text-slate-700">
                            Property:
                          </span>{" "}
                          {inspection.notice.lease.unit.property.name}
                        </p>
                        <p>
                          <span className="font-medium text-slate-700">
                            Building:
                          </span>{" "}
                          {inspection.notice.lease.unit.building?.name ?? "—"}
                        </p>
                        <p>
                          <span className="font-medium text-slate-700">
                            Apartment:
                          </span>{" "}
                          {inspection.notice.lease.unit.houseNo}
                        </p>
                        <p>
                          <span className="font-medium text-slate-700">
                            Tenant phone:
                          </span>{" "}
                          {inspection.notice.tenant.phone || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-sm text-slate-600 lg:text-right">
                      <p>
                        <span className="font-medium text-slate-700">
                          Scheduled:
                        </span>{" "}
                        {formatDateTime(inspection.scheduledAt)}
                      </p>
                      <p className="mt-1">
                        <span className="font-medium text-slate-700">
                          Move-out date:
                        </span>{" "}
                        {formatDate(inspection.notice.moveOutDate)}
                      </p>
                      <p className="mt-1">
                        <span className="font-medium text-slate-700">
                          Inspector:
                        </span>{" "}
                        {inspection.inspector.fullName}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/dashboard/caretaker/inspections/${inspection.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      {inspection.status === "COMPLETED"
                        ? "View submitted report"
                        : "Perform inspection"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}