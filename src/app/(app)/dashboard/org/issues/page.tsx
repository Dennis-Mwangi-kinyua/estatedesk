import Link from "next/link";
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
import { getIssueFilterLabel } from "./_lib/helpers";

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  const data = await getOrgIssuesPageData(searchParams);

  if (data.stats.totalIssues === 0) {
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
        <IssuesStats stats={data.stats} activeFilter={data.activeFilter} />

        <SurfaceCard className="p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[22px] font-semibold tracking-tight text-neutral-950">
                {getIssueFilterLabel(data.activeFilter)}
              </h2>
              <p className="mt-1 text-sm leading-6 text-neutral-500">
                Use the status buttons above to focus one issue stage at a time.
                The list and pagination below follow the selected stage.
              </p>
            </div>
            {data.activeFilter !== "all" ? (
              <Link
                href="/dashboard/org/issues"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 bg-white px-4 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                Show all
              </Link>
            ) : null}
          </div>

          {data.issues.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-black/10 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
              No issues in {getIssueFilterLabel(data.activeFilter).toLowerCase()}.
            </div>
          ) : (
            <IssuesStageBoard
              issues={data.issues}
              selectedIssueId={data.selectedIssue?.id}
              currentPage={data.currentPage}
              activeFilter={data.activeFilter}
            />
          )}
        </SurfaceCard>

        <IssueDetailsCard
          issue={data.selectedIssue}
          caretakers={data.caretakers}
          currentPage={data.currentPage}
          activeFilter={data.activeFilter}
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
            activeFilter={data.activeFilter}
          />

          <IssuesPagination
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            totalItems={data.issues.length}
            historyStart={data.historyStart}
            historyEnd={data.historyEnd}
            selectedIssueId={data.selectedIssue?.id}
            activeFilter={data.activeFilter}
          />
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
