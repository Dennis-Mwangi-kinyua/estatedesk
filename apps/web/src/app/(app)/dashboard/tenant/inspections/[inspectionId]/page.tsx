// src/app/(app)/dashboard/tenant/inspections/[inspectionId]/page.tsx

import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { PageShell, SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import { Prisma } from "@prisma/client";
import { ArrowDownToLine, ArrowLeft, CalendarDays, CheckCircle2, ClipboardCheck, Home, User2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireTenantAccess } from "@/lib/permissions/guards";
import { reportChecklistItems } from "@/app/(app)/dashboard/caretaker/inspections/[inspectionId]/_lib/constants";
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

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
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

  const checklist =
    inspection.checklist &&
    typeof inspection.checklist === "object" &&
    !Array.isArray(inspection.checklist)
      ? (inspection.checklist as Record<string, unknown>)
      : {};
  const roomPhotos =
    checklist.roomPhotos &&
    typeof checklist.roomPhotos === "object" &&
    !Array.isArray(checklist.roomPhotos)
      ? (checklist.roomPhotos as Record<string, string>)
      : {};
  const checkIn =
    checklist.checkIn &&
    typeof checklist.checkIn === "object" &&
    !Array.isArray(checklist.checkIn)
      ? (checklist.checkIn as Record<string, unknown>)
      : {};
  const roomPhotoIds = Object.values(roomPhotos).filter(
    (assetId): assetId is string => typeof assetId === "string" && Boolean(assetId),
  );
  if (typeof checkIn.photoAssetId === "string") {
    roomPhotoIds.push(checkIn.photoAssetId);
  }
  const photoAssets = roomPhotoIds.length
    ? await prisma.asset.findMany({
        where: {
          id: { in: roomPhotoIds },
          orgId: session.activeOrgId,
          unitId: inspection.notice.lease.unitId,
          deletedAt: null,
        },
        select: { id: true, fileName: true, key: true, mimeType: true },
      })
    : [];
  const assetsById = new Map(photoAssets.map((asset) => [asset.id, asset]));
  const downloadHref = `/dashboard/tenant/inspections/${publicInspectionId}/download`;
  const reportSubmitted = inspection.status === "COMPLETED";

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

              <div className="flex flex-wrap items-center gap-2">
                {reportSubmitted ? (
                  <a
                    href={downloadHref}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                    Download report PDF
                  </a>
                ) : null}
                <span
                  className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${getInspectionStatusClasses(
                    inspection.status
                  )}`}
                >
                  {inspection.status.replaceAll("_", " ")}
                </span>
              </div>
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
                  <ClipboardCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Inspection reference
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {inspection.referenceCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ClipboardCheck className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Move-out notice reference
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {inspection.notice.referenceCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Notice date
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(inspection.notice.noticeDate)}
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
                Move-out notice notes
              </h2>

              <div className="mt-4 ed-theme-muted-panel rounded-[20px] p-4 text-sm leading-6 text-foreground/80">
                {inspection.notice.notes?.trim()
                  ? inspection.notice.notes
                  : "No additional move-out notice notes were recorded."}
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-foreground/80" />
              <h2 className="text-lg font-semibold text-foreground">
                Property condition checklist
              </h2>
            </div>

            {reportSubmitted ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {reportChecklistItems.map((item) => (
                  <div
                    key={item.key}
                    className="rounded-2xl border border-border bg-muted/20 p-4"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {checklist[item.key] === true
                        ? "Yes"
                        : checklist[item.key] === false
                          ? "No"
                          : "Not recorded"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 ed-theme-muted-panel rounded-[20px] p-4 text-sm text-foreground/80">
                The inspection has not been submitted yet.
              </div>
            )}
          </SurfaceCard>

          <div className="grid gap-4 md:grid-cols-2">
            <SurfaceCard className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Inspection summary
              </h2>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/80">
                {typeof checklist.summary === "string" && checklist.summary.trim()
                  ? checklist.summary
                  : inspection.notes?.trim() || "No summary was recorded."}
              </p>
            </SurfaceCard>

            <SurfaceCard className="p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-foreground">
                Damage and recommended repairs
              </h2>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/80">
                {typeof checklist.recommendations === "string" && checklist.recommendations.trim()
                  ? checklist.recommendations
                  : "No repair recommendations were recorded."}
              </p>
            </SurfaceCard>
          </div>

          <SurfaceCard className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Photo evidence
            </h2>
            {photoAssets.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ...Object.entries(roomPhotos),
                  ...(typeof checkIn.photoAssetId === "string"
                    ? [["Site check-in", checkIn.photoAssetId] as [string, string]]
                    : []),
                ].map(([roomKey, assetId]) => {
                  const asset = assetsById.get(assetId);
                  if (!asset) return null;
                  const photoSrc = /^https?:\/\//.test(asset.key)
                    ? asset.key
                    : `/${asset.key.replace(/^\/+/, "")}`;

                  return (
                    <figure
                      key={asset.id}
                      className="overflow-hidden rounded-2xl border border-border bg-muted/20"
                    >
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={photoSrc}
                          alt={`${roomKey.replaceAll(/([A-Z])/g, " $1")} inspection evidence`}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                      <figcaption className="px-3 py-2 text-sm text-muted-foreground">
                        {roomKey.replaceAll(/([A-Z])/g, " $1")} · {asset.fileName}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No room photos were attached to this inspection.
              </p>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Submission record
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Report status
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {reportSubmitted ? "Submitted for office review" : "Awaiting inspection"}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Submitted at
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDateTime(
                    typeof checklist.submittedAt === "string"
                      ? checklist.submittedAt
                      : inspection.completedAt,
                  )}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  On-site check-in
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {typeof checkIn.capturedAt === "string"
                    ? formatDateTime(checkIn.capturedAt)
                    : "Not recorded"}
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
    </PageShell>
  );
}
