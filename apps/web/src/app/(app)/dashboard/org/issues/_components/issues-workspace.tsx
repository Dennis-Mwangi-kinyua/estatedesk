import type { OrgRole } from "@prisma/client";
import { DeferredLink } from "@/components/navigation/app-links";
import type { OrgIssuesPageData } from "../_lib/types";
import { getIssueFilterLabel } from "../_lib/helpers";
import { IssueDetailsCard } from "./issue-details-card";
import { IssuesGuidance } from "./issues-guidance";
import { IssuesHeader } from "./issues-header";
import { IssuesHistory } from "./issues-history";
import { IssuesPagination } from "./issues-pagination";
import { IssuesStageBoard } from "./issues-stage-board";
import { IssuesStats } from "./issues-stats";
import { panelShellClassName } from "./issues-ui";

export function IssuesWorkspace({
  data,
  orgRole,
}: {
  data: OrgIssuesPageData;
  orgRole?: OrgRole | null;
}) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <IssuesHeader membership={data.membership} stats={data.stats} orgRole={orgRole} />
      <IssuesStats stats={data.stats} activeFilter={data.activeFilter} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className={`${panelShellClassName} p-4 sm:p-6`}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
                  {getIssueFilterLabel(data.activeFilter)}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Use the status buttons above to focus one issue stage at a time.
                  The list and pagination below follow the selected stage.
                </p>
              </div>
              {data.activeFilter !== "all" ? (
                <DeferredLink
                  href="/dashboard/org/issues"
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted/30"
                >
                  Show all
                </DeferredLink>
              ) : null}
            </div>

            {data.totalFiltered === 0 ? (
              <div className="rounded-[24px] border border-dashed border-border bg-muted/10 p-8 text-center text-sm text-muted-foreground">
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
          </section>

          <IssueDetailsCard
            issue={data.selectedIssue}
            caretakers={data.caretakers}
            currentPage={data.currentPage}
            activeFilter={data.activeFilter}
            canAssignCaretaker={data.canAssignCaretaker}
          />

          <section className={`${panelShellClassName} p-4 sm:p-6 xl:p-7`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[22px] font-semibold tracking-tight text-foreground">
                  History
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tap any issue to open it, review progress, and move it through
                  the next stage.
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
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
              totalItems={data.totalFiltered}
              historyStart={data.historyStart}
              historyEnd={data.historyEnd}
              selectedIssueId={data.selectedIssue?.id}
              activeFilter={data.activeFilter}
            />
          </section>
        </div>

        <IssuesGuidance orgRole={orgRole} />
      </div>
    </div>
  );
}