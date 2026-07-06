import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerInspectionsPageData } from "../_lib/queries";

type InspectionsStatsProps = {
  stats: CaretakerInspectionsPageData["stats"];
};

export function InspectionsStats({ stats }: InspectionsStatsProps) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total inspections"
        value={stats.total}
        note="Allocated to your scope"
        icon={ClipboardList}
      />
      <StatCard
        label="Scheduled"
        value={stats.scheduled}
        note="Awaiting field completion"
        icon={CalendarClock}
        highlight={stats.scheduled > 0 ? "warning" : "default"}
      />
      <StatCard
        label="Completed"
        value={stats.completed}
        note="Reports submitted"
        icon={CheckCircle2}
        highlight={stats.completed > 0 ? "success" : "default"}
      />
      <StatCard
        label="Cancelled"
        value={stats.cancelled}
        note="No longer active"
        icon={XCircle}
      />
    </section>
  );
}