import type { getMemberDetailData } from "../_lib/queries";
import { MemberCaretakerSection } from "./member-detail-caretaker-section";
import { MemberDetailAccountSection } from "./member-detail-account-section";
import { MemberDetailDeactivateSection } from "./member-detail-deactivate-section";
import { MemberDetailGuidance } from "./member-detail-guidance";
import { MemberDetailHeader } from "./member-detail-header";
import { MemberDetailHrSection } from "./member-detail-hr-section";

export type MemberDetailWorkspaceProps = Awaited<
  ReturnType<typeof getMemberDetailData>
>;

export function MemberDetailWorkspace(props: MemberDetailWorkspaceProps) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <MemberDetailHeader {...props} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <MemberDetailAccountSection {...props} />
          <MemberDetailHrSection {...props} />
          <MemberCaretakerSection {...props} />
          <MemberDetailDeactivateSection {...props} />
        </div>

        <MemberDetailGuidance {...props} />
      </div>
    </div>
  );
}