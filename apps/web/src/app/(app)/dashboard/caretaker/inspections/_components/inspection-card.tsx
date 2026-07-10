import Link from "next/link";
import { encodePublicId } from "@/lib/public-id";
import { badgeClass, formatDate, formatDateTime } from "../_lib/helpers";
import type { CaretakerInspectionsPageData } from "../_lib/queries";

type InspectionCardProps = {
  inspection: CaretakerInspectionsPageData["inspections"][number];
};

export function InspectionCard({ inspection }: InspectionCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/25 hover:shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground sm:text-base">
              {inspection.notice.tenant.fullName}
            </h3>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${badgeClass(
                inspection.status,
              )}`}
            >
              {inspection.status.toLowerCase()}
            </span>
          </div>

          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Property:</span>{" "}
              {inspection.notice.lease.unit.property.name}
            </p>
            <p>
              <span className="font-medium text-foreground">Building:</span>{" "}
              {inspection.notice.lease.unit.building?.name ?? "—"}
            </p>
            <p>
              <span className="font-medium text-foreground">Apartment:</span>{" "}
              {inspection.notice.lease.unit.houseNo}
            </p>
            <p>
              <span className="font-medium text-foreground">Tenant phone:</span>{" "}
              {inspection.notice.tenant.phone || "—"}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-sm text-muted-foreground lg:text-right">
          <p>
            <span className="font-medium text-foreground">Scheduled:</span>{" "}
            {formatDateTime(inspection.scheduledAt)}
          </p>
          <p className="mt-1">
            <span className="font-medium text-foreground">Move-out date:</span>{" "}
            {formatDate(inspection.notice.moveOutDate)}
          </p>
          <p className="mt-1">
            <span className="font-medium text-foreground">Inspector:</span>{" "}
            {inspection.inspector.fullName}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Link
          href={`/dashboard/caretaker/inspections/${encodePublicId(
            inspection.id,
            "inspection",
          )}`}
          className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          {inspection.status === "COMPLETED"
            ? "View submitted report"
            : "Perform inspection"}
        </Link>
      </div>
    </article>
  );
}