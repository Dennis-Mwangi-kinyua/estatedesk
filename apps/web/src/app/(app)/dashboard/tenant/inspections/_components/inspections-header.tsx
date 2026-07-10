import { SurfaceCard } from "@/components/theme/ed-dashboard-shell";
import type { PreparedNotice } from "@/app/(app)/dashboard/tenant/inspections/_lib/types";

export function InspectionsHeader({
  latestInspectionNotice,
}: {
  latestInspectionNotice: PreparedNotice | null;
}) {
  return (
    <SurfaceCard className="p-5 sm:p-6 lg:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Tenant Inspections
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-foreground sm:text-[32px]">
            Inspections
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            View inspections linked to your move-out notices, including schedule,
            inspector, status, and completion notes.
          </p>
        </div>

        {latestInspectionNotice ? (
          <div className="ed-theme-muted-panel rounded-[24px] px-4 py-4 sm:px-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Latest Inspection
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {latestInspectionNotice.unitLabel}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {latestInspectionNotice.inspectionScheduledAtLabel}
            </p>
          </div>
        ) : (
          <div className="ed-theme-muted-panel rounded-[24px] px-4 py-4 sm:px-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Inspection Status
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              Awaiting scheduling
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              No inspection scheduled yet
            </p>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}