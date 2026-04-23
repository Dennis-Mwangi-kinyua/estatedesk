// src/app/(app)/dashboard/org/inspections/[inspectionId]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUserSession } from "@/lib/auth/session";

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

export default async function OrgInspectionDetailPage({ params }: PageProps) {
  const session = await requireUserSession();
  const { inspectionId } = await params;

  if (!session.activeOrgId) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 shadow-sm">
        No active organisation found for your account.
      </div>
    );
  }

  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      notice: {
        lease: {
          orgId: session.activeOrgId,
          deletedAt: null,
        },
      },
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
          notes: true,
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard/org/tenants"
              className="inline-flex w-fit items-center text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              <span aria-hidden="true" className="mr-2">
                ←
              </span>
              Back
            </Link>

            <Link
              href={`/print/inspections/${inspection.id}`}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Print report
            </Link>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Office inspection view
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

            <span
              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${badgeClass(
                inspection.status
              )}`}
            >
              {inspection.status.replaceAll("_", " ")}
            </span>
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
          <p className="text-sm text-slate-500">Inspector</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {inspection.inspector.fullName}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <p className="text-sm text-slate-500">Completed at</p>
          <p className="mt-1 text-sm font-semibold text-slate-950">
            {formatDateTime(inspection.completedAt)}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
            Notice details
          </h2>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm text-slate-500">Tenant</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {inspection.notice.tenant.fullName}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {inspection.notice.tenant.email || "—"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {inspection.notice.tenant.phone || "—"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm text-slate-500">Notice notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
              {inspection.notice.notes ?? "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
            Inspection report
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Submitted by the assigned caretaker for office review.
          </p>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {isCompleted ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">Cleanliness</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {readBool(report, "cleanlinessOk")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">Walls condition</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {readBool(report, "wallsOk")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">Doors & windows</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {readBool(report, "doorsWindowsOk")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">Plumbing</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {readBool(report, "plumbingOk")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">Electrical</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {readBool(report, "electricalOk")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">Keys returned</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {readBool(report, "keysReturned")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">Meter readings taken</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {readBool(report, "meterReadingsTaken")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm text-slate-500">Damage observed</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {readBool(report, "damageObserved")}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-500">Summary</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {String(report.summary ?? inspection.notes ?? "—")}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm text-slate-500">Recommendations</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {String(report.recommendations ?? "—")}
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              The caretaker has not submitted the inspection report yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}