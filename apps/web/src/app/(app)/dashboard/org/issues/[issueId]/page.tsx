import { requireManagementAccess } from "@/lib/permissions/guards";
import { getIssueDetailPageData } from "../_lib/queries";
import { IssueDetailWorkspace } from "./_components/issue-detail-workspace";

type PageProps = {
  params: Promise<{
    issueId: string;
  }>;
};

export default async function IssueDetailsPage({ params }: PageProps) {
  const session = await requireManagementAccess();
  const { issueId } = await params;

  if (!session.activeOrgId) {
    return null;
  }

  const data = await getIssueDetailPageData(issueId, session.activeOrgId);

  return (
    <IssueDetailWorkspace data={data} orgRole={session.activeOrgRole} />
  );
}