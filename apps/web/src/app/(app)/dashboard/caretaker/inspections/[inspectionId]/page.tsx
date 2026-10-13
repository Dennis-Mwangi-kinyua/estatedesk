import { notFound, redirect } from "next/navigation";
import { requireCaretakerAccess } from "@/lib/permissions/guards";
import { InspectionDetailWorkspace } from "./_components/inspection-detail-workspace";
import { getCaretakerInspectionDetail } from "./_lib/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    inspectionId: string;
  }>;
};

export default async function CaretakerInspectionDetailPage({
  params,
}: PageProps) {
  const session = await requireCaretakerAccess();
  const { inspectionId: publicInspectionId } = await params;

  const result = await getCaretakerInspectionDetail({
    orgId: session.activeOrgId!,
    userId: session.userId,
    membershipScope: session.membershipScope,
    publicInspectionId,
  });

  if (!result.ok) {
    if (result.notFound) {
      notFound();
    }

    return <InspectionDetailWorkspace result={result} />;
  }

  if (result.redirectTo) {
    redirect(result.redirectTo);
  }

  return <InspectionDetailWorkspace result={result} />;
}