import Link from "next/link";
import type { OrgRole } from "@prisma/client";
import { encodePublicId } from "@/lib/public-id";
import {
  buttonPrimaryClassName,
  panelShellClassName,
  StatCard,
} from "@/app/(app)/dashboard/org/properties/_components/properties-ui";
import { InspectionDetailsGuidance } from "./inspection-details-guidance";

export type InspectionDetailsData = {
  id: string;
  status: string;
  scheduledAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  checklist: unknown;
  inspector: {
    id: string;
    fullName: string;
    phone: string | null;
    email: string | null;
  };
  notice: {
    id: string;
    noticeDate: Date;
    moveOutDate: Date | null;
    status: string;
    notes: string | null;
    tenant: {
      id: string;
      fullName: string;
      phone: string | null;
      email: string | null;
    };
    lease: {
      id: string;
      status: string;
      startDate: Date;
      endDate: Date | null;
      unit: {
        id: string;
        houseNo: string;
        property: {
          id: string;
          name: string;
        };
        building: {
          id: string;
          name: string;
        } | null;
      };
    };
  };
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

function readBool(report: Record<string, unknown>, key: string): "Yes" | "No" {
  return report[key] === true ? "Yes" : "No";
}

function badgeClass(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200";
    default:
      return "border-border bg-muted/30 text-muted-foreground";
  }
}

function ReportField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function InspectionDetailsWorkspace({
  inspection,
  orgRole,
}: {
  inspection: InspectionDetailsData;
  orgRole?: OrgRole | null;
}) {
  const report = (inspection.checklist ?? {}) as Record<string, unknown>;
  const isCompleted = inspection.status === "COMPLETED";
  const locationLabel = [
    inspection.notice.lease.unit.property.name,
    inspection.notice.lease.unit.building?.name,
    `Apartment ${inspection.notice.lease.unit.houseNo}`,
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <section className={`${panelShellClassName} p-5 sm:p-6`}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/dashboard/org/tenants"
              className="inline-flex w-fit items-center text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <span aria-hidden="true" className="mr-2">
                ←
              </span>
              Back
            </Link>

            <Link
              href={`/print/inspections/${encodePublicId(
                inspection.id,
                "inspection",
              )}`}
              className={buttonPrimaryClassName}
            >
              Print report
            </Link>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Office inspection view
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {inspection.notice.tenant.fullName}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {locationLabel}
              </p>
            </div>

            <span
              className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${badgeClass(
                inspection.status,
              )}`}
            >
              {inspection.status.replaceAll("_", " ")}
            </span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Scheduled" value={formatDateTime(inspection.scheduledAt)} />
        <StatCard label="Move-out date" value={formatDate(inspection.notice.moveOutDate)} />
        <StatCard label="Inspector" value={inspection.inspector.fullName} />
        <StatCard label="Completed at" value={formatDateTime(inspection.completedAt)} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className={panelShellClassName}>
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                Notice details
              </h2>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
                <p className="text-sm text-muted-foreground">Tenant</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {inspection.notice.tenant.fullName}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {inspection.notice.tenant.email || "—"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {inspection.notice.tenant.phone || "—"}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
                <p className="text-sm text-muted-foreground">Notice notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {inspection.notice.notes ?? "—"}
                </p>
              </div>
            </div>
          </section>

          <section className={panelShellClassName}>
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-foreground sm:text-lg">
                Inspection report
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Submitted by the assigned caretaker for office review.
              </p>
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              {isCompleted ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ReportField
                      label="Cleanliness"
                      value={readBool(report, "cleanlinessOk")}
                    />
                    <ReportField
                      label="Walls condition"
                      value={readBool(report, "wallsOk")}
                    />
                    <ReportField
                      label="Doors & windows"
                      value={readBool(report, "doorsWindowsOk")}
                    />
                    <ReportField
                      label="Plumbing"
                      value={readBool(report, "plumbingOk")}
                    />
                    <ReportField
                      label="Electrical"
                      value={readBool(report, "electricalOk")}
                    />
                    <ReportField
                      label="Keys returned"
                      value={readBool(report, "keysReturned")}
                    />
                    <ReportField
                      label="Meter readings taken"
                      value={readBool(report, "meterReadingsTaken")}
                    />
                    <ReportField
                      label="Damage observed"
                      value={readBool(report, "damageObserved")}
                    />
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
                    <p className="text-sm text-muted-foreground">Summary</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {String(report.summary ?? inspection.notes ?? "—")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
                    <p className="text-sm text-muted-foreground">Recommendations</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {String(report.recommendations ?? "—")}
                    </p>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/10 px-4 py-6 text-sm text-muted-foreground">
                  The caretaker has not submitted the inspection report yet.
                </div>
              )}
            </div>
          </section>
        </div>

        <InspectionDetailsGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}