import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireManagementAccess } from "@/lib/permissions/guards";

type PageProps = {
  params: Promise<{
    issueId: string;
  }>;
};

export default async function IssueDetailsPage({ params }: PageProps) {
  const session = await requireManagementAccess();
  const { issueId } = await params;

  const issue = await prisma.issueTicket.findFirst({
    where: {
      id: issueId,
      orgId: session.activeOrgId!,
    },
  });

  if (!issue) {
    notFound();
  }

  return (
    <div>
      <h1>{issue.title}</h1>
      <p>{issue.description}</p>
    </div>
  );
}
