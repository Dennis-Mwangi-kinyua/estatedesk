import {
  CheckCircle2,
  Clock3,
  ListTodo,
  XCircle,
} from "lucide-react";
import type { IssuesStats as IssuesStatsType } from "../_lib/types";
import { StatCard } from "./issues-page-shell";

export function IssuesStats({ stats }: { stats: IssuesStatsType }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={<ListTodo className="h-4 w-4" />}
        label="New"
        value={stats.newIssues}
        tone={stats.newIssues > 0 ? "accent" : "default"}
      />
      <StatCard
        icon={<Clock3 className="h-4 w-4" />}
        label="In Progress"
        value={stats.inProgressIssues}
      />
      <StatCard
        icon={<CheckCircle2 className="h-4 w-4" />}
        label="Resolved"
        value={stats.resolvedIssues}
      />
      <StatCard
        icon={<XCircle className="h-4 w-4" />}
        label="Cancelled"
        value={stats.cancelledIssues}
      />
    </section>
  );
}