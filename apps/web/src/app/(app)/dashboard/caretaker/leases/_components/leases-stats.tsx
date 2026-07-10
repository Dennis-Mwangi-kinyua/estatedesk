import { CheckCircle2, Clock3, FileText } from "lucide-react";
import { StatCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerLeasesPageData } from "../_lib/types";

export function LeasesStats({
  data,
}: {
  data: Pick<
    CaretakerLeasesPageData,
    "totalLeases" | "activeLeases" | "nonActiveLeases"
  >;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <StatCard
        label="Total leases"
        value={data.totalLeases}
        note="Assigned to your scope"
        icon={FileText}
      />
      <StatCard
        label="Active"
        value={data.activeLeases}
        note="Currently in force"
        icon={CheckCircle2}
        highlight={data.activeLeases > 0 ? "success" : "default"}
      />
      <StatCard
        label="Other"
        value={data.nonActiveLeases}
        note="Expired or terminated"
        icon={Clock3}
      />
    </section>
  );
}