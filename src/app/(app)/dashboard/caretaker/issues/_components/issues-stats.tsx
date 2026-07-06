import {
  AlertCircle,
  CheckCircle2,
  Hammer,
  Zap,
} from "lucide-react";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { CaretakerI18nLabel } from "@/app/(app)/dashboard/caretaker/_components/caretaker-i18n-label";
import type { IssueDataResult } from "@/app/(app)/dashboard/caretaker/issues/_lib/types";
import { FilterStatCard } from "./issues-ui";

type IssuesStatsProps = {
  issueData: Pick<
    IssueDataResult,
    | "openIssues"
    | "inProgressIssues"
    | "resolvedTodayIssues"
    | "urgentIssues"
  >;
  activeFilters: {
    status: TicketStatus | null;
    priority: TicketPriority | null;
    range: string;
  };
};

export function IssuesStats({ issueData, activeFilters }: IssuesStatsProps) {
  const { status, priority, range } = activeFilters;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <FilterStatCard
        title={<CaretakerI18nLabel labelKey="openIssuesStat" />}
        value={String(issueData.openIssues).padStart(2, "0")}
        note={<CaretakerI18nLabel labelKey="openIssuesNote" />}
        href="/dashboard/caretaker/issues?status=OPEN"
        isActive={status === TicketStatus.OPEN}
        highlight={issueData.openIssues > 0 ? "warning" : "default"}
        icon={AlertCircle}
      />
      <FilterStatCard
        title={<CaretakerI18nLabel labelKey="inProgress" />}
        value={String(issueData.inProgressIssues).padStart(2, "0")}
        note={<CaretakerI18nLabel labelKey="inProgressNote" />}
        href="/dashboard/caretaker/issues?status=IN_PROGRESS"
        isActive={status === TicketStatus.IN_PROGRESS}
        icon={Hammer}
      />
      <FilterStatCard
        title={<CaretakerI18nLabel labelKey="resolvedTodayStat" />}
        value={String(issueData.resolvedTodayIssues).padStart(2, "0")}
        note={<CaretakerI18nLabel labelKey="resolvedTodayNote" />}
        href="/dashboard/caretaker/issues?status=RESOLVED&range=today"
        isActive={status === TicketStatus.RESOLVED && range === "today"}
        highlight={issueData.resolvedTodayIssues > 0 ? "success" : "default"}
        icon={CheckCircle2}
      />
      <FilterStatCard
        title={<CaretakerI18nLabel labelKey="urgentCases" />}
        value={String(issueData.urgentIssues).padStart(2, "0")}
        note={<CaretakerI18nLabel labelKey="urgentNote" />}
        href="/dashboard/caretaker/issues?priority=URGENT"
        isActive={priority === TicketPriority.URGENT}
        highlight={issueData.urgentIssues > 0 ? "warning" : "default"}
        icon={Zap}
      />
    </section>
  );
}