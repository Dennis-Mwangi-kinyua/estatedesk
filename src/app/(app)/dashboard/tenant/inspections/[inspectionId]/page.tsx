// src/app/(app)/dashboard/tenant/inspections/[inspectionId]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardCheck, Home, User2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";

const tenantInspectionArgs = Prisma.validator<Prisma.InspectionDefaultArgs>()({
  include: {
    inspector: {
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
    },
    notice: {
      include: {
        tenant: true,
        lease: {
          include: {
            unit: {
              include: {
                property: true,
                building: true,
              },
            },
          },
        },
      },
    },
  },
});

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getInspectionStatusClasses(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
}

function getUnitLabel(inspection: Prisma.InspectionGetPayload<typeof tenantInspectionArgs>) {
  const unit = inspection.notice.lease.unit;

  return `${unit.property.name} • Unit ${unit.houseNo}${
    unit.building?.name ? ` • ${unit.building.name}` : ""
  }`;
}

function SurfaceCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border border-black/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

export default async function TenantInspectionReportPage({
  params,
}: {
  params: Promise<{ inspectionId: string }>;
}) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    throw new Error("Missing user id in session");
  }

  if (!session.activeOrgId) {
    throw new Error("Missing active organization id in session");
  }

  const { inspectionId } = await params;

  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      notice: {
        tenant: {
          userId: session.userId,
          orgId: session.activeOrgId,
          deletedAt: null,
        },
      },
    },
    ...tenantInspectionArgs,
  });

  if (!inspection) {
    notFound();
  }

  const checklistItems = Array.isArray(inspection.checklist)
    ? inspection.checklist
    : [];

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 sm:py-6 xl:px-8">
        <div className="space-y-4 sm:space-y-6">
          <Link
            href="/dashboard/tenant/inspections"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to inspections
          </Link>

          <SurfaceCard className="p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                  Inspection Report
                </p>
                <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-neutral-950 sm:text-[32px]">
                  {getUnitLabel(inspection)}
                </h1>
                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Review your move-out inspection details, assigned inspector,
                  completion date, and any notes recorded for this inspection.
                </p>
              </div>

              <span
                className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${getInspectionStatusClasses(
                  inspection.status
                )}`}
              >
                {inspection.status.replaceAll("_", " ")}
              </span>
            </div>
          </SurfaceCard>

          <div className="grid gap-4 md:grid-cols-2">
            <SurfaceCard className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-neutral-950">
                Inspection details
              </h2>

              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-neutral-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Scheduled at
                    </p>
                    <p className="text-sm font-medium text-neutral-900">
                      {formatDateTime(inspection.scheduledAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-neutral-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Completed at
                    </p>
                    <p className="text-sm font-medium text-neutral-900">
                      {formatDateTime(inspection.completedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Home className="mt-0.5 h-4 w-4 text-neutral-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Move-out date
                    </p>
                    <p className="text-sm font-medium text-neutral-900">
                      {formatDate(inspection.notice.moveOutDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User2 className="mt-0.5 h-4 w-4 text-neutral-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Inspector
                    </p>
                    <p className="text-sm font-medium text-neutral-900">
                      {inspection.inspector.fullName}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {inspection.inspector.email ?? "—"}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {inspection.inspector.phone ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-neutral-950">
                Notes
              </h2>

              <div className="mt-4 rounded-[20px] bg-[#fafafa] p-4 text-sm leading-6 text-neutral-700">
                {inspection.notes?.trim()
                  ? inspection.notes
                  : "No inspection notes were recorded for this report."}
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-neutral-700" />
              <h2 className="text-lg font-semibold text-neutral-950">
                Checklist
              </h2>
            </div>

            {checklistItems.length > 0 ? (
              <div className="mt-4 space-y-3">
                {checklistItems.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-[18px] border border-black/5 bg-[#fafafa] p-4 text-sm text-neutral-700"
                  >
                    <pre className="whitespace-pre-wrap break-words font-sans">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[20px] bg-[#fafafa] p-4 text-sm text-neutral-700">
                No checklist items were attached to this inspection.
              </div>
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}