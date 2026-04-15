import { getOrgIssuesPageData } from "./_lib/queries";
import type { IssuesPageProps } from "./_lib/types";
import { PageShell, SurfaceCard } from "./_components/issues-page-shell";
import { IssuesEmptyState } from "./_components/issues-empty-state";
import { IssuesHeader } from "./_components/issues-header";
import { IssuesStats } from "./_components/issues-stats";
import { IssuesStageBoard } from "./_components/issues-stage-board";
import { IssueDetailsCard } from "./_components/issue-details-card";
import { IssuesHistory } from "./_components/issues-history";
import { IssuesPagination } from "./_components/issues-pagination";

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  const data = await getOrgIssuesPageData(searchParams);

  if (data.issues.length === 0) {
    return (
      <PageShell>
        <IssuesEmptyState organizationName={data.membership.org.name} />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-4 sm:space-y-6">
        <IssuesHeader membership={data.membership} stats={data.stats} />
        <IssuesStats stats={data.stats} />

        <SurfaceCard className="p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
              Workflow Board
            </h2>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              Swipe on mobile like an iOS board. New tickets disappear from the
              first lane immediately after caretaker allocation because they are
              moved to progress.
            </p>
          </div>

          <IssuesStageBoard
            issues={data.issues}
            selectedIssueId={data.selectedIssue?.id}
            currentPage={data.currentPage}
          />
        </SurfaceCard>

        <IssueDetailsCard
          issue={data.selectedIssue}
          caretakers={data.caretakers}
          currentPage={data.currentPage}
          canAssignCaretaker={data.canAssignCaretaker}
        />

        <SurfaceCard className="p-4 sm:p-6 xl:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
                History
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Tap any issue to open it, review progress, and move it through
                the next stage.
              </p>
            </div>
            <span className="text-xs font-medium text-neutral-500">
              Page {data.currentPage} of {data.totalPages}
            </span>
          </div>

          <IssuesHistory
            issues={data.paginatedIssues}
            selectedIssueId={data.selectedIssue?.id}
            currentPage={data.currentPage}
          />

          <IssuesPagination
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            totalItems={data.issues.length}
            historyStart={data.historyStart}
            historyEnd={data.historyEnd}
            selectedIssueId={data.selectedIssue?.id}
          />
        </SurfaceCard>
      </div>
    </PageShell>
  );
}