import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { NewIssueWorkspace } from "./_components/new-issue-workspace";
import { EMERGENCY_ISSUE_TEMPLATE } from "./_lib/constants";
import { getNewIssueUnitPrefill } from "./_lib/queries";

type PageProps = {
  searchParams?: Promise<{
    title?: string;
    description?: string;
    unitId?: string;
    template?: string;
  }>;
};

export default async function NewCaretakerIssuePage({ searchParams }: PageProps) {
  const session = await requireCaretakerAccess();
  const resolved = (await searchParams) ?? {};
  const isEmergencyTemplate = resolved.template === "emergency";

  const unitPrefill = await getNewIssueUnitPrefill({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    publicUnitId: resolved.unitId,
  });

  return (
    <NewIssueWorkspace
      sharedTitle={
        isEmergencyTemplate
          ? EMERGENCY_ISSUE_TEMPLATE.title
          : (resolved.title?.slice(0, 120) ?? "")
      }
      sharedDescription={
        isEmergencyTemplate
          ? EMERGENCY_ISSUE_TEMPLATE.description
          : (resolved.description?.slice(0, 2000) ?? "")
      }
      defaultPriority={
        isEmergencyTemplate ? EMERGENCY_ISSUE_TEMPLATE.priority : "MEDIUM"
      }
      unitPrefill={unitPrefill}
      isEmergencyTemplate={isEmergencyTemplate}
    />
  );
}