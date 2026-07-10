import Link from "next/link";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { ListPagination } from "@/app/(app)/dashboard/caretaker/_components/list-pagination";
import { IssueCard } from "@/app/(app)/dashboard/caretaker/issues/_components/issue-card";
import {
  EmptyStateCard,
  ErrorStateCard,
  panelShellClassName,
  SectionIntro,
} from "@/app/(app)/dashboard/caretaker/issues/_components/issues-ui";
import { buildIssuesPageHref } from "@/app/(app)/dashboard/caretaker/issues/_lib/helpers";
import type { IssueDataResult } from "@/app/(app)/dashboard/caretaker/issues/_lib/types";

type IssuesBoardProps = {
  issueData: IssueDataResult;
  currentUserId: string;
  boardTitle: string;
  boardDescription: string;
  status: TicketStatus | null;
  priority: TicketPriority | null;
  range: string;
};

export function IssuesBoard({
  issueData,
  currentUserId,
  boardTitle,
  boardDescription,
  status,
  priority,
  range,
}: IssuesBoardProps) {
  const hasFilter = Boolean(status || priority || range);

  return (
    <section className={panelShellClassName}>
      <SectionIntro
        eyebrow="Issue board"
        title={boardTitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {hasFilter ? (
              <Link
                href="/dashboard/caretaker/issues"
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted/30"
              >
                Clear filter
              </Link>
            ) : null}
            <span className="rounded-full border border-border bg-muted/20 px-3 py-1 text-xs font-medium text-muted-foreground">
              {issueData.totalFiltered} total
            </span>
          </div>
        }
      />

      <p className="border-b border-border px-5 pb-4 text-sm leading-6 text-muted-foreground sm:px-6">
        {boardDescription}
      </p>

      <div className="space-y-3 p-4 sm:p-5">
        {!issueData.ok ? (
          <ErrorStateCard message={issueData.errorMessage} />
        ) : issueData.issues.length === 0 ? (
          <EmptyStateCard
            title="No matching issues found"
            description="No issue records match this card filter yet. Create a new issue or clear the filter to view all records."
          />
        ) : (
          issueData.issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>

      <div className="border-t border-border px-4 py-4 sm:px-5">
        <ListPagination
          currentPage={issueData.currentPage}
          totalPages={issueData.totalPages}
          showingFrom={issueData.showingFrom}
          showingTo={issueData.showingTo}
          totalItems={issueData.totalFiltered}
          buildHref={(nextPage) =>
            buildIssuesPageHref(nextPage, { status, priority, range })
          }
        />
      </div>
    </section>
  );
}