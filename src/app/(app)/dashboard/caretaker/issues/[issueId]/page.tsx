import { notFound, redirect } from "next/navigation";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { IssueDetailWorkspace } from "./_components/issue-detail-workspace";
import { getCaretakerIssueDetail } from "./_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    issueId: string;
  }>;
};

export default async function CaretakerIssueDetailPage({ params }: PageProps) {
  const session = await requireCaretakerAccess();
  const { issueId: publicIssueId } = await params;

  const data = await getCaretakerIssueDetail({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    publicIssueId,
  });

  if (!data.ok) {
    if (data.notFound) {
      notFound();
    }

    return <IssueDetailWorkspace data={data} currentUserId={session.userId} />;
  }

  if (data.redirectTo) {
    redirect(data.redirectTo);
  }

  return <IssueDetailWorkspace data={data} currentUserId={session.userId} />;
}