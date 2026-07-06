import { CalendarDays, CheckCircle2 } from "lucide-react";
import { SurfaceCard, StatCard } from "@/components/theme/ed-dashboard-shell";
import { formatDate, formatDateTime } from "@/lib/formatters";
import type { TenantNoticesResult } from "@/app/(app)/dashboard/tenant/notices/_lib/queries";
import { getMoveOutStatusClasses } from "@/app/(app)/dashboard/tenant/notices/_lib/helpers";
import { EmptySection } from "@/app/(app)/dashboard/tenant/notices/_components/empty-section";

type GivenNoticesCardProps = {
  moveOutNotices: TenantNoticesResult["moveOutNotices"];
  activeMoveOutNotices: number;
  closedMoveOutNotices: number;
};

export function GivenNoticesCard({
  moveOutNotices,
  activeMoveOutNotices,
  closedMoveOutNotices,
}: GivenNoticesCardProps) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
          Given Notices
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your submitted move-out notices and their progress.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<CalendarDays className="h-4 w-4" />} label="Active" value={activeMoveOutNotices} />
        <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Closed" value={closedMoveOutNotices} />
      </div>

      <div className="mt-4 space-y-3">
        {moveOutNotices.length > 0 ? (
          moveOutNotices.map((notice) => (
            <div
              key={notice.id}
              className="rounded-[20px] ed-theme-card border border-border bg-muted/35 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {notice.lease.unit.property.name} • Unit {notice.lease.unit.houseNo}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Notice date: {formatDate(notice.noticeDate)}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getMoveOutStatusClasses(
                    notice.status,
                  )}`}
                >
                  {notice.status.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Move-Out Date
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {formatDate(notice.moveOutDate)}
                  </p>
                </div>

                <div className="rounded-[16px] border border-border/60 bg-card px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Inspection
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {notice.inspection
                      ? formatDateTime(notice.inspection.scheduledAt)
                      : "Not scheduled"}
                  </p>
                </div>
              </div>

              {notice.notes ? (
                <div className="mt-3 rounded-[16px] border border-border/60 bg-card px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Notes
                  </p>
                  <p className="mt-1 text-sm text-foreground/80">{notice.notes}</p>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <EmptySection
            title="No submitted notices"
            description="You have not submitted any move-out notices yet."
            guideTopic="moveOut"
          />
        )}
      </div>
    </SurfaceCard>
  );
}