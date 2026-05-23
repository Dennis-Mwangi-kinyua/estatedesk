import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    issueId: string;
  }>;
};

export default async function IssueDetailsPage({ params }: PageProps) {
  const { issueId } = await params;

  const issue = await prisma.issueTicket.findUnique({
    where: { id: issueId },
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