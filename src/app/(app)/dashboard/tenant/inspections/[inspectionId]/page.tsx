// src/app/(app)/dashboard/tenant/inspections/[inspectionId]/page.tsx

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageShell, SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { Prisma } from "@prisma/client";
import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardCheck, Home, User2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import {
  decodePublicId,
  encodePublicId,
  isEncodedPublicId,
} from "@/lib/public-id";

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
      return "border-neutral-200 bg-neutral-100 text-foreground/80";
  }
}

function getUnitLabel(inspection: Prisma.InspectionGetPayload<typeof tenantInspectionArgs>) {
  const unit = inspection.notice.lease.unit;

  return `${unit.property.name} • Unit ${unit.houseNo}${
    unit.building?.name ? ` • ${unit.building.name}` : ""
  }`;
}



export default async function TenantInspectionReportPage({
  params,
}: {
  params: Promise<{ inspectionId: string }>;
}) {
  const session = await requireTenantAccess();

  if (!session.userId) {
    redirect("/login");
  }

  if (!session.activeOrgId) {
    redirect("/dashboard/tenant");
  }

  const { inspectionId: publicInspectionId } = await params;
  const inspectionId = decodePublicId(publicInspectionId, "inspection");

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

  if (!isEncodedPublicId(publicInspectionId)) {
    redirect(
      `/dashboard/tenant/inspections/${encodePublicId(
        inspection.id,
        "inspection",
      )}`,
    );
  }

  const checklistItems = Array.isArray(inspection.checklist)
    ? inspection.checklist
    : [];

  return (
    <PageShell>
        <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-6">
          <Link
            href="/dashboard/tenant/inspections"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to inspections
          </Link>

          <SurfaceCard className="p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Inspection Report
                </p>
                <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
                  {getUnitLabel(inspection)}
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
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
              <h2 className="text-lg font-semibold text-foreground">
                Inspection details
              </h2>

              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Scheduled at
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(inspection.scheduledAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Completed at
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(inspection.completedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Home className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Move-out date
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(inspection.notice.moveOutDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Inspector
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {inspection.inspector.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {inspection.inspector.email ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {inspection.inspector.phone ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Notes
              </h2>

              <div className="mt-4 ed-theme-muted-panel rounded-[20px] p-4 text-sm leading-6 text-foreground/80">
                {inspection.notes?.trim()
                  ? inspection.notes
                  : "No inspection notes were recorded for this report."}
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-foreground/80" />
              <h2 className="text-lg font-semibold text-foreground">
                Checklist
              </h2>
            </div>

            {checklistItems.length > 0 ? (
              <div className="mt-4 space-y-3">
                {checklistItems.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-[18px] ed-theme-card border border-border bg-muted/35 p-4 text-sm text-foreground/80"
                  >
                    <pre className="whitespace-pre-wrap break-words font-sans">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 ed-theme-muted-panel rounded-[20px] p-4 text-sm text-foreground/80">
                No checklist items were attached to this inspection.
              </div>
            )}
          </SurfaceCard>
        </div>
    </PageShell>
  );
}
