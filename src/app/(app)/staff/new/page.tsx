import { requireCurrentOrgId } from "@/lib/auth/org";
import { StaffNewWorkspace } from "./_components/staff-new-workspace";
import { getCaretakerAssignmentTargets } from "./_lib/queries";

export default async function NewStaffPage() {
  const orgId = await requireCurrentOrgId();
  const assignmentTargets = await getCaretakerAssignmentTargets(orgId);

  return <StaffNewWorkspace assignmentTargets={assignmentTargets} />;
}