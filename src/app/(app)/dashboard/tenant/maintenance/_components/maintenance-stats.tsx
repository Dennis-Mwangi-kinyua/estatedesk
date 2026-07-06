import { StatCard } from "@/components/theme/ed-dashboard-shell";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Wrench,
} from "lucide-react";
import type { TenantMaintenancePageData } from "../_lib/types";

export function MaintenanceStats({ data }: { data: TenantMaintenancePageData }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
      <StatCard
        icon={<Wrench className="h-4 w-4" />}
        label="Total Issues"
        value={data.totalIssues}
      />
      <StatCard
        icon={<AlertCircle className="h-4 w-4" />}
        label="Open"
        value={data.openIssues}
      />
      <StatCard
        icon={<Clock3 className="h-4 w-4" />}
        label="In Progress"
        value={data.inProgressIssues}
      />
      <StatCard
        icon={<CheckCircle2 className="h-4 w-4" />}
        label="Resolved"
        value={data.resolvedIssues}
      />
    </section>
  );
}