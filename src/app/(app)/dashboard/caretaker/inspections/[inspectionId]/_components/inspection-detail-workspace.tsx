import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { completeInspectionAction } from "../_lib/complete-inspection-action";
import { encodePublicId } from "@/lib/public-id";
import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  panelBodyClassName,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { badgeClass } from "../../_lib/helpers";
import { inspectionChecklistFields, reportChecklistItems } from "../_lib/constants";
import {
  formatDate,
  formatDateTime,
  readBool,
  readText,
  type ReportData,
} from "../_lib/helpers";
import type { getCaretakerInspectionDetail } from "../_lib/queries";
import { ChecklistInput, DetailCard, ReportCard } from "./detail-cards";
import { InspectionCheckIn } from "./inspection-check-in";

type InspectionDetailResult = Awaited<
  ReturnType<typeof getCaretakerInspectionDetail>
>;

export function InspectionDetailWorkspace({
  result,
}: {
  result: InspectionDetailResult;
}) {
  if (!result.ok) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
        <section className={panelShellClassName}>
          <div className={panelBodyClassName}>
            <ErrorStateCard
              title="Could not load inspection"
              message={result.errorMessage}
            />
          </div>
        </section>

        <CaretakerWorkspaceFooter note="Move-out inspection detail" />
      </div>
    );
  }

  const inspection = result.inspection;
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
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <section className={panelShellClassName}>
        <div className={panelBodyClassName}>
          <Link
            href="/dashboard/caretaker/inspections"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to inspections
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm text-muted-foreground">Caretaker inspection task</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {tenantName}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {locationLabel}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium capitalize ${badgeClass(
                  inspection.status,
                )}`}
              >
                {inspection.status.toLowerCase()}
              </span>

              {isCompleted ? (
                <>
                  <Link
                    href="#inspection-report"
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/30"
                  >
                    View report
                  </Link>
                  <Link
                    href={`/print/inspections/${encodePublicId(
                      inspection.id,
                      "inspection",
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    Print report
                  </Link>
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
            This task is visible because it belongs to your current caretaker
            allocations.
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          className={`scroll-mt-24 ${panelShellClassName}`}
        >
          <SectionIntro
            eyebrow="Submitted report"
            title="Inspection report"
            action={
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                Completed
              </span>
            }
          />

          <div className="space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {reportChecklistItems.map((item) => (
                <ReportCard
                  key={item.key}
                  label={item.label}
                  value={readBool(report, item.key)}
                />
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
              <p className="text-sm text-muted-foreground">Summary</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {summary}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/10 px-4 py-4">
              <p className="text-sm text-muted-foreground">Recommendations</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
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
        <section className={panelShellClassName}>
          <SectionIntro
            eyebrow="Field work"
            title="Perform inspection"
          />

          <p className="border-b border-border px-5 pb-4 text-sm leading-6 text-muted-foreground sm:px-6">
            Complete the checklist and submit the report to the office.
          </p>

          <form
            action={completeInspectionAction}
            encType="multipart/form-data"
            className={`space-y-6 ${panelBodyClassName}`}
          >
            <input type="hidden" name="inspectionId" value={inspection.id} />

            <InspectionCheckIn />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {inspectionChecklistFields.map((field) => (
                <ChecklistInput
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  photoName={`photo_${field.name}`}
                />
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="summary"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Inspection summary
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  rows={5}
                  required
                  placeholder="Write the overall apartment inspection summary"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40"
                />
              </div>

              <div>
                <label
                  htmlFor="recommendations"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  Recommendations for office
                </label>
                <textarea
                  id="recommendations"
                  name="recommendations"
                  rows={4}
                  placeholder="Add repair notes, deductions, or office follow-up actions"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/40"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Submit report to office
              </button>

              <Link
                href="/dashboard/caretaker/inspections"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition hover:bg-muted/30"
              >
                Cancel
              </Link>
            </div>
          </form>
        </section>
      )}

      <CaretakerWorkspaceFooter note="Move-out inspection detail" />
    </div>
  );
}