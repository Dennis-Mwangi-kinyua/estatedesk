import { StatCard } from "@/components/theme/ed-dashboard-shell";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  XCircle,
} from "lucide-react";
import type { InspectionTotals } from "@/app/(app)/dashboard/tenant/inspections/_lib/types";

export function InspectionsStats({ totals }: { totals: InspectionTotals }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
      <StatCard
        icon={<ClipboardCheck className="h-4 w-4" />}
        label="Move-Out Notices"
        value={totals.totalNotices}
      />
      <StatCard
        icon={<Clock3 className="h-4 w-4" />}
        label="Scheduled"
        value={totals.scheduled}
      />
      <StatCard
        icon={<CheckCircle2 className="h-4 w-4" />}
        label="Completed"
        value={totals.completed}
      />
      <StatCard
        icon={<XCircle className="h-4 w-4" />}
        label="Cancelled"
        value={totals.cancelled}
      />
    </section>
  );
}