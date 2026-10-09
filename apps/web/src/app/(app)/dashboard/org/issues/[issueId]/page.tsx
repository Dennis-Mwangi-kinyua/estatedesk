import { requireManagementAccess } from "@/lib/permissions/guards";
import { redirect } from "next/navigation";
import { getIssueDetailPageData } from "../_lib/queries";
import { IssueDetailWorkspace } from "./_components/issue-detail-workspace";
import { decodePublicSlug } from "@/lib/public-id";
import { buildIssueDetailHref } from "../_lib/helpers";

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

  const data = await getIssueDetailPageData(decodePublicSlug(issueId, "issue"), session.activeOrgId);

  const canonicalHref = buildIssueDetailHref(data.issue.id, data.issue.title);
  if (issueId !== canonicalHref.split("/").at(-1)) redirect(canonicalHref);

  return (
    <IssueDetailWorkspace data={data} orgRole={session.activeOrgRole} />
  );
}
