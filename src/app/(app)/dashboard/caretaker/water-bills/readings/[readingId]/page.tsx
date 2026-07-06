import { notFound, redirect } from "next/navigation";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { ReadingDetailWorkspace } from "./_components/reading-detail-workspace";
import { getCaretakerReadingDetailData } from "./_lib/queries";

export const dynamic = "force-dynamic";

export default async function ReadingDetailPage({
  params,
}: {
  params: Promise<{ readingId: string }>;
}) {
  const { readingId: publicReadingId } = await params;
  const session = await requireCaretakerAccess();
  const data = await getCaretakerReadingDetailData({
    orgId: session.activeOrgId!,
    caretakerUserId: session.userId,
    membershipScope: session.membershipScope,
    publicReadingId,
  });

  if (!data.ok) {
    if (data.notFound) notFound();
    return <ReadingDetailWorkspace data={data} />;
  }

  if (data.redirectTo) redirect(data.redirectTo);
  return <ReadingDetailWorkspace data={data} />;
}