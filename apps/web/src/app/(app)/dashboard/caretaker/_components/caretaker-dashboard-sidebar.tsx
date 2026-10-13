import Link from "@/components/navigation/workspace-link";
import { encodePublicId } from "@/lib/public-id";
import {
  formatDateTime,
  getUnitLabel,
} from "@/app/(app)/dashboard/caretaker/_lib/helpers";
import type {
  UpcomingInspection,
} from "@/app/(app)/dashboard/caretaker/_lib/types";
import {
  panelShellClassName,
} from "./caretaker-ui";

export function CaretakerDashboardSidebar({
  upcomingInspections,
}: {
  upcomingInspections: UpcomingInspection[];
}) {
  return (
    <div className="min-w-0 space-y-5">
      <section className={`${panelShellClassName} p-4`}>
        <h2 className="text-sm font-semibold text-foreground">Upcoming inspections</h2>

        {upcomingInspections.length > 0 ? (
          <div className="mt-4 space-y-2">
            {upcomingInspections.map((inspection) => (
              <Link
                key={inspection.id}
                href={`/dashboard/caretaker/inspections/${encodePublicId(
                  inspection.id,
                  "inspection",
                )}`}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border bg-muted/10 p-3 text-sm transition hover:border-primary/25 hover:bg-muted/20"
              >
                <div className="min-w-0">
                  <p className="ed-full-name whitespace-normal break-words [overflow-wrap:anywhere] font-semibold text-foreground">
                    {inspection.notice.tenant.fullName}
                  </p>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {getUnitLabel({ unit: inspection.notice.lease.unit })}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {formatDateTime(inspection.scheduledAt)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No upcoming inspections.</p>
        )}
      </section>

    </div>
  );
}
