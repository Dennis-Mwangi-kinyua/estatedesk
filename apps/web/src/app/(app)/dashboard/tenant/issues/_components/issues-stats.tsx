import { StatCard } from "@/components/theme/ed-dashboard-shell";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  MessageSquareWarning,
} from "lucide-react";
import type { TenantIssuesPageData } from "@/app/(app)/dashboard/tenant/issues/_lib/types";

export function IssuesStats({ data }: { data: TenantIssuesPageData }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:gap-4">
      <StatCard
        icon={<MessageSquareWarning className="h-4 w-4" />}
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