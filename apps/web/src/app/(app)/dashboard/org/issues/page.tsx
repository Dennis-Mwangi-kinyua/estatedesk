import { redirect } from "next/navigation";
import { requireManagementAccess } from "@/lib/permissions/guards";
import {
  canCreateOrgIssue,
  resolveIssueCreatePath,
} from "@/lib/issues/share-routing";
import { decodePublicSlug } from "@/lib/public-id";
import { buildIssueDetailHref } from "./_lib/helpers";
import { getIssueDetailPageData, getOrgIssuesPageData } from "./_lib/queries";
import type { IssuesPageProps } from "./_lib/types";
import { IssuesEmptyWorkspace } from "./_components/issues-empty-workspace";
import { IssuesWorkspace } from "./_components/issues-workspace";

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  const session = await requireManagementAccess();
  const params = (await searchParams) ?? {};

  if (params.shared === "1" && canCreateOrgIssue(session.activeOrgRole)) {
    const query = new URLSearchParams();
    if (params.title) query.set("title", params.title);
    if (params.description) query.set("description", params.description);
    query.set("shared", "1");
    const search = query.toString() ? `?${query.toString()}` : "";
    redirect(
      resolveIssueCreatePath({ role: session.activeOrgRole, search }),
    );
  }

  if (params.issueId) {
    const detail = await getIssueDetailPageData(decodePublicSlug(params.issueId, "issue"), session.activeOrgId!);
    redirect(buildIssueDetailHref(detail.issue.id, detail.issue.title));
  }

  const data = await getOrgIssuesPageData(Promise.resolve(params));

  if (data.stats.totalIssues === 0) {
    return (
      <IssuesEmptyWorkspace
        organizationName={data.membership.org.name}
        role={data.membership.role}
        orgRole={session.activeOrgRole}
      />
    );
  }

  return (
    <IssuesWorkspace data={data} orgRole={session.activeOrgRole} />
  );
}