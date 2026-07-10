import { CheckCircle2, Clock3, Droplets } from "lucide-react";
import { StatCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerMeterReadPageData } from "../_lib/types";

export function ReadStats({
  data,
}: {
  data: Extract<CaretakerMeterReadPageData, { ok: true }>;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        label="Pending"
        value={data.pendingUnits.length}
        note="Occupied units still needing a reading"
        icon={Clock3}
        highlight={data.pendingUnits.length > 0 ? "warning" : "success"}
      />
      <StatCard
        label="Submitted"
        value={data.submittedCount}
        note={`Readings captured for ${data.period}`}
        icon={CheckCircle2}
      />
      <StatCard
        label="Assigned units"
        value={data.totalUnits}
        note="Occupied units in your assignment"
        icon={Droplets}
      />
    </section>
  );
}