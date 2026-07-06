import { TicketPriority, TicketStatus } from "@prisma/client";
import type { IssueDataResult } from "@/app/(app)/dashboard/caretaker/issues/_lib/types";
import { CaretakerWorkspaceFooter } from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import { IssuesBoard } from "./issues-board";
import { IssuesHeader } from "./issues-header";
import { IssuesSidebar } from "./issues-sidebar";
import { IssuesStats } from "./issues-stats";

export type IssuesWorkspaceProps = {
  issueData: IssueDataResult;
  currentUserId: string;
  boardTitle: string;
  boardDescription: string;
  status: TicketStatus | null;
  priority: TicketPriority | null;
  range: string;
};

export function IssuesWorkspace({
  issueData,
  currentUserId,
  boardTitle,
  boardDescription,
  status,
  priority,
  range,
}: IssuesWorkspaceProps) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      <IssuesHeader issueData={issueData} />

      <IssuesStats
        issueData={issueData}
        activeFilters={{ status, priority, range }}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <IssuesBoard
          issueData={issueData}
          currentUserId={currentUserId}
          boardTitle={boardTitle}
          boardDescription={boardDescription}
          status={status}
          priority={priority}
          range={range}
        />

        <IssuesSidebar />
      </div>

      <CaretakerWorkspaceFooter note="Professional maintenance and operations tracking" />
    </div>
  );
}