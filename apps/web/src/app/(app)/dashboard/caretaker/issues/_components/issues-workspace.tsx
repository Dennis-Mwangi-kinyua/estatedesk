import { TicketPriority, TicketStatus } from "@prisma/client";
import type { IssueDataResult } from "@/app/(app)/dashboard/caretaker/issues/_lib/types";
import { IssuesBoard } from "./issues-board";
import { IssuesHeader } from "./issues-header";
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

      <IssuesBoard
        issueData={issueData}
        currentUserId={currentUserId}
        boardTitle={boardTitle}
        boardDescription={boardDescription}
        status={status}
        priority={priority}
        range={range}
      />

    </div>
  );
}
