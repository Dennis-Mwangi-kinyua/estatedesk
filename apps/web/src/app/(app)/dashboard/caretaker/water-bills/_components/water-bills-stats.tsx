import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Send,
} from "lucide-react";
import { StatCard } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { formatCurrency } from "../_lib/helpers";
import type { CaretakerWaterBillsData } from "../_lib/types";

export function WaterBillsStats({
  data,
}: {
  data: Pick<
    CaretakerWaterBillsData,
    | "pendingUnits"
    | "submittedReadings"
    | "approvedReadings"
    | "issuedBills"
    | "totalBilled"
  >;
}) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Pending reading"
        value={data.pendingUnits.length}
        note="Occupied units that still need meter entry"
        icon={AlertCircle}
        highlight={data.pendingUnits.length > 0 ? "warning" : "default"}
        href="/dashboard/caretaker/water-bills/read"
      />
      <StatCard
        label="Awaiting approval"
        value={data.submittedReadings.length}
        note="Submitted readings waiting for office review"
        icon={Clock3}
      />
      <StatCard
        label="Approved"
        value={data.approvedReadings.length}
        note="Office-approved readings ready for billing"
        icon={CheckCircle2}
        highlight={data.approvedReadings.length > 0 ? "success" : "default"}
      />
      <StatCard
        label="Sent to tenant"
        value={data.issuedBills.length}
        note={`Bills issued this period · ${formatCurrency(data.totalBilled)}`}
        icon={Send}
      />
    </section>
  );
}