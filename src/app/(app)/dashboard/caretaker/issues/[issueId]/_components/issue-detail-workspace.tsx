import {
  CaretakerWorkspaceFooter,
  ErrorStateCard,
  panelBodyClassName,
  panelShellClassName,
} from "@/app/(app)/dashboard/caretaker/_components/caretaker-ui";
import type { CaretakerIssueDetailPageData } from "../_lib/types";
import { IssueDetailHeader } from "./issue-detail-header";
import { IssueDetailSections } from "./issue-detail-sections";

export function IssueDetailWorkspace({
  data,
  currentUserId,
}: {
  data: CaretakerIssueDetailPageData;
  currentUserId: string;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6 sm:space-y-6">
      {!data.ok ? (
        <section className={panelShellClassName}>
          <div className={panelBodyClassName}>
            <ErrorStateCard
              title="Could not load issue"
              message={data.errorMessage}
            />
          </div>
        </section>
      ) : (
        <>
          <IssueDetailHeader issue={data.issue} />
          <IssueDetailSections issue={data.issue} currentUserId={currentUserId} />
        </>
      )}

      <CaretakerWorkspaceFooter note="Maintenance issue detail" />
    </div>
  );
}