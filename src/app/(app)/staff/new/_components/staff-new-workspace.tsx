import { createMembership } from "@/features/staff/actions/create-membership";
import { MemberForm } from "@/features/staff/components/member-form";
import type { AssignmentTarget } from "@/features/staff/components/_lib/types";
import { StaffNewGuidance } from "./staff-new-guidance";
import { StaffNewHeader } from "./staff-new-header";

type StaffNewWorkspaceProps = {
  assignmentTargets: AssignmentTarget[];
};

export function StaffNewWorkspace({ assignmentTargets }: StaffNewWorkspaceProps) {
  return (
    <div className="org-theme-content mx-auto w-full max-w-7xl space-y-6 px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <StaffNewHeader assignmentTargetCount={assignmentTargets.length} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <MemberForm
          action={createMembership}
          submitLabel="Create staff"
          assignmentTargets={assignmentTargets}
        />

        <StaffNewGuidance />
      </div>
    </div>
  );
}