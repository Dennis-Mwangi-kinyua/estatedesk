import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import { completeInspectionAction } from "@/features/inspections/actions/complete-inspection-action";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    inspectionId: string;
  }>;
};

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

function readBool(
  report: Record<string, unknown>,
  key: string
): "Yes" | "No" {
  return report[key] === true ? "Yes" : "No";
}

export default async function CaretakerInspectionDetailPage({
  params,
}: PageProps) {
  const session = await requireUserSession();
  const { inspectionId } = await params;

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm">
        No active organisation found for your account.
      </div>
    );
  }

  if (session.activeOrgRole !== "CARETAKER") {
    redirect("/dashboard");
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

  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
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
    include: {
      inspector: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
        },
      },
      notice: {
        select: {
          id: true,
          noticeDate: true,
          moveOutDate: true,
          status: true,
          tenant: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
            },
          },
          lease: {
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
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
    },
  });

  if (!inspection) {
    notFound();
  }

  const report = (inspection.checklist ?? {}) as Record<string, unknown>;
  const isCompleted = inspection.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-4 p-5 sm:p-6">
          <Link
            href="/dashboard/caretaker/inspections"
            className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            <span aria-hidden="true" className="mr-2">
              ←
            </span>
            Back to my inspections
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Caretaker inspection task
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {inspection.notice.tenant.fullName}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {inspection.notice.lease.unit.property.name}
                {inspection.notice.lease.unit.building?.name
                  ? ` — ${inspection.notice.lease.unit.building.name}`
                  : ""}
                {` — Apartment ${inspection.notice.lease.unit.houseNo}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                {inspection.status}
              </span>

              {isCompleted ? (
                <Link
                  href="#inspection-report"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  View inspection report
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            This task is visible because it belongs to your current caretaker
            allocations.
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-sm text-slate-500">Scheduled</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {formatDateTime(inspection.scheduledAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-sm text-slate-500">Move-out date</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {formatDate(inspection.notice.moveOutDate)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-sm text-slate-500">Tenant phone</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {inspection.notice.tenant.phone || "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-sm text-slate-500">Inspector</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {inspection.inspector.fullName}
          </p>
        </div>
      </section>

      {isCompleted ? (
        <section
          id="inspection-report"
          className="rounded-3xl border border-emerald-200 bg-emerald-50 shadow-sm scroll-mt-24"
        >
          <div className="border-b border-emerald-100 px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-emerald-950 sm:text-lg">
              Submitted inspection report
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              This inspection has already been completed and submitted to office.
            </p>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-500">Cleanliness</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {readBool(report, "cleanlinessOk")}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-500">Walls condition</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {readBool(report, "wallsOk")}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-500">Doors & windows</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {readBool(report, "doorsWindowsOk")}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-500">Plumbing</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {readBool(report, "plumbingOk")}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-500">Electrical</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {readBool(report, "electricalOk")}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-500">Keys returned</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {readBool(report, "keysReturned")}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-500">Meter readings taken</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {readBool(report, "meterReadingsTaken")}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
                <p className="text-sm text-slate-500">Damage observed</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {readBool(report, "damageObserved")}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
              <p className="text-sm text-slate-500">Summary</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                {String(report.summary ?? inspection.notes ?? "—")}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
              <p className="text-sm text-slate-500">Recommendations</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                {String(report.recommendations ?? "—")}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
              <p className="text-sm text-slate-500">Completed at</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {formatDateTime(inspection.completedAt)}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
              Perform inspection
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Complete the checklist and submit the report to office.
            </p>
          </div>

          <form action={completeInspectionAction} className="space-y-6 p-5 sm:p-6">
            <input type="hidden" name="inspectionId" value={inspection.id} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="cleanlinessOk" className="h-4 w-4 rounded border-slate-300" />
                Cleanliness is acceptable
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="wallsOk" className="h-4 w-4 rounded border-slate-300" />
                Walls are in good condition
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="doorsWindowsOk" className="h-4 w-4 rounded border-slate-300" />
                Doors and windows are okay
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="plumbingOk" className="h-4 w-4 rounded border-slate-300" />
                Plumbing is okay
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="electricalOk" className="h-4 w-4 rounded border-slate-300" />
                Electrical fixtures are okay
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="keysReturned" className="h-4 w-4 rounded border-slate-300" />
                Keys have been returned
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="meterReadingsTaken" className="h-4 w-4 rounded border-slate-300" />
                Meter readings captured
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" name="damageObserved" className="h-4 w-4 rounded border-slate-300" />
                Damage has been observed
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="summary"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Inspection summary
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  rows={5}
                  required
                  placeholder="Write the overall apartment inspection summary"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              <div>
                <label
                  htmlFor="recommendations"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Recommendations for office
                </label>
                <textarea
                  id="recommendations"
                  name="recommendations"
                  rows={4}
                  placeholder="Add repair notes, deductions, or office follow-up actions"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Submit report to office
              </button>

              <Link
                href="/dashboard/caretaker/inspections"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}