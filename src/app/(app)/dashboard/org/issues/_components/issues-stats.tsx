import { DeferredLink } from "@/components/navigation/app-links";
import type { ReactNode } from "react";
import { CheckCircle2, Clock3, ListTodo, XCircle } from "lucide-react";
import type {
  IssueStatusFilter,
  IssuesStats as IssuesStatsType,
} from "../_lib/types";
import { buildIssuesHref } from "../_lib/helpers";

type StatButtonProps = {
  filter: IssueStatusFilter;
  activeFilter: IssueStatusFilter;
  icon: ReactNode;
  label: string;
  value: number;
  accent?: boolean;
};

function StatButton({
  filter,
  activeFilter,
  icon,
  label,
  value,
  accent = false,
}: StatButtonProps) {
  const active = filter === activeFilter;

  return (
    <DeferredLink
      href={buildIssuesHref(1, undefined, filter)}
      className={[
        "rounded-[24px] border p-4 shadow-sm transition active:scale-[0.99]",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : accent
            ? "border-amber-200 bg-amber-50 text-foreground hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
            : "border-border bg-card text-foreground hover:bg-muted/30",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={[
              "text-xs font-medium uppercase tracking-[0.16em]",
              active ? "text-primary-foreground/70" : "text-muted-foreground",
            ].join(" ")}
          >
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold">{value}</p>
        </div>
        <div
          className={[
            "flex h-10 w-10 items-center justify-center rounded-2xl",
            active
              ? "bg-primary-foreground/10 text-primary-foreground"
              : "bg-muted/30 text-foreground",
          ].join(" ")}
        >
          {icon}
        </div>
      </div>
    </DeferredLink>
  );
}

export function IssuesStats({
  stats,
  activeFilter,
}: {
  stats: IssuesStatsType;
  activeFilter: IssueStatusFilter;
}) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatButton
        filter="new"
        activeFilter={activeFilter}
        icon={<ListTodo className="h-4 w-4" />}
        label="New"
        value={stats.newIssues}
        accent={stats.newIssues > 0}
      />
      <StatButton
        filter="progress"
        activeFilter={activeFilter}
        icon={<Clock3 className="h-4 w-4" />}
        label="In Progress"
        value={stats.inProgressIssues}
      />
      <StatButton
        filter="resolved"
        activeFilter={activeFilter}
        icon={<CheckCircle2 className="h-4 w-4" />}
        label="Resolved"
        value={stats.resolvedIssues}
      />
      <StatButton
        filter="cancelled"
        activeFilter={activeFilter}
        icon={<XCircle className="h-4 w-4" />}
        label="Cancelled"
        value={stats.cancelledIssues}
      />
    </section>
  );
}
