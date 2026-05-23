import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";
import {
  decodePublicId,
  encodePublicId,
  isEncodedPublicId,
} from "@/lib/public-id";
import { completeInspectionAction } from "@/features/inspections/actions/complete-inspection-action";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    inspectionId: string;
  }>;
};

type ReportData = Record<string, unknown>;

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-KE", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const reportChecklistItems = [
  { label: "Cleanliness", key: "cleanlinessOk" },
  { label: "Walls condition", key: "wallsOk" },
  { label: "Doors & windows", key: "doorsWindowsOk" },
  { label: "Plumbing", key: "plumbingOk" },
  { label: "Electrical", key: "electricalOk" },
  { label: "Keys returned", key: "keysReturned" },
  { label: "Meter readings taken", key: "meterReadingsTaken" },
  { label: "Damage observed", key: "damageObserved" },
] as const;

const inspectionChecklistFields = [
  {
    name: "cleanlinessOk",
    label: "Cleanliness is acceptable",
  },
  {
    name: "wallsOk",
    label: "Walls are in good condition",
  },
  {
    name: "doorsWindowsOk",
    label: "Doors and windows are okay",
  },
  {
    name: "plumbingOk",
    label: "Plumbing is okay",
  },
  {
    name: "electricalOk",
    label: "Electrical fixtures are okay",
  },
  {
    name: "keysReturned",
    label: "Keys have been returned",
  },
  {
    name: "meterReadingsTaken",
    label: "Meter readings captured",
  },
  {
    name: "damageObserved",
    label: "Damage has been observed",
  },
] as const;

function toValidDate(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: Date | string | null | undefined) {
  const date = toValidDate(value);

  return date ? dateFormatter.format(date) : "—";
}

function formatDateTime(value: Date | string | null | undefined) {
  const date = toValidDate(value);

  return date ? dateTimeFormatter.format(date) : "—";
}

function readBool(report: ReportData, key: string): "Yes" | "No" {
  return report[key] === true ? "Yes" : "No";
}

function readText(value: unknown, fallback = "—") {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : fallback;
}

function buildCaretakerAllocationFilters(args: {
  userId: string;
  propertyIds: string[];
  buildingIds: string[];
  unitIds: string[];
}) {
  const { userId, propertyIds, buildingIds, unitIds } = args;

  const filters: Prisma.InspectionWhereInput[] = [
    {
      notice: {
        lease: {
          caretakerUserId: userId,
        },
      },
    },
  ];

  if (unitIds.length > 0) {
    filters.push({
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
    filters.push({
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
    filters.push({
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

  return filters;
}

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ReportCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function ChecklistInput({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <input
        type="checkbox"
        name={name}
        className="h-4 w-4 rounded border-slate-300"
      />
      {label}
    </label>
  );
}

export default async function CaretakerInspectionDetailPage({
  params,
}: PageProps) {
  const session = await requireUserSession();
  const { inspectionId: publicInspectionId } = await params;
  const inspectionId = decodePublicId(publicInspectionId, "inspection");

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

  const allocationFilters = buildCaretakerAllocationFilters({
    userId: session.userId,
    propertyIds,
    buildingIds,
    unitIds,
  });

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

  if (!isEncodedPublicId(publicInspectionId)) {
    redirect(
      `/dashboard/caretaker/inspections/${encodePublicId(
        inspection.id,
        "inspection",
      )}`,
    );
  }

  const report = (inspection.checklist ?? {}) as ReportData;
  const isCompleted = inspection.status === "COMPLETED";

  const tenantName = inspection.notice.tenant.fullName;
  const propertyName = inspection.notice.lease.unit.property.name;
  const buildingName = inspection.notice.lease.unit.building?.name;
  const houseNo = inspection.notice.lease.unit.houseNo;

  const locationLabel = [
    propertyName,
    buildingName,
    `Apartment ${houseNo}`,
  ]
    .filter(Boolean)
    .join(" — ");

  const summary = readText(report.summary, inspection.notes ?? "—");
  const recommendations = readText(report.recommendations);

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
                {tenantName}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {locationLabel}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                {inspection.status}
              </span>

              {isCompleted ? (
                <>
                  <Link
                    href="#inspection-report"
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    View inspection report
                  </Link>

                  <Link
                    href={`/print/inspections/${encodePublicId(
                      inspection.id,
                      "inspection",
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Print report
                  </Link>
                </>
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
        <DetailCard
          label="Scheduled"
          value={formatDateTime(inspection.scheduledAt)}
        />

        <DetailCard
          label="Move-out date"
          value={formatDate(inspection.notice.moveOutDate)}
        />

        <DetailCard
          label="Tenant phone"
          value={inspection.notice.tenant.phone || "—"}
        />

        <DetailCard label="Inspector" value={inspection.inspector.fullName} />
      </section>

      {isCompleted ? (
        <section
          id="inspection-report"
          className="scroll-mt-24 rounded-3xl border border-emerald-200 bg-emerald-50 shadow-sm"
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
              {reportChecklistItems.map((item) => (
                <ReportCard
                  key={item.key}
                  label={item.label}
                  value={readBool(report, item.key)}
                />
              ))}
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
              <p className="text-sm text-slate-500">Summary</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                {summary}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-4">
              <p className="text-sm text-slate-500">Recommendations</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                {recommendations}
              </p>
            </div>

            <ReportCard
              label="Completed at"
              value={formatDateTime(inspection.completedAt)}
            />
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

          <form
            action={completeInspectionAction}
            className="space-y-6 p-5 sm:p-6"
          >
            <input type="hidden" name="inspectionId" value={inspection.id} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {inspectionChecklistFields.map((field) => (
                <ChecklistInput
                  key={field.name}
                  name={field.name}
                  label={field.label}
                />
              ))}
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
